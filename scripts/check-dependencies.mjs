// Dependency hygiene checks that run in CI.
//
// 1. Direct dependencies must not be prerelease. The internal npm mirror used
//    on some development machines serves canary/alpha builds as `latest`.
// 2. The lockfile must be portable: no internal hostnames, and no SHA-1
//    integrity hashes. A lockfile generated behind that mirror is neither, and
//    would fail to install anywhere else.
import { globSync, readFileSync } from 'node:fs';

const PRERELEASE = /-(alpha|beta|rc|canary|next|dev|integration)/i;
const INTERNAL_HOST = /(visualstudio\.com|packagefeedproxy\.microsoft\.io|pkgs\.dev\.azure\.com)/;

let failures = 0;

function fail(message, file) {
  console.log(file ? `::error file=${file}::${message}` : `::error::${message}`);
  failures += 1;
}

const manifests = [
  'package.json',
  ...globSync('apps/*/package.json'),
  ...globSync('packages/*/package.json'),
];

for (const file of manifests) {
  const pkg = JSON.parse(readFileSync(file, 'utf8'));

  for (const field of ['dependencies', 'devDependencies']) {
    for (const [name, range] of Object.entries(pkg[field] ?? {})) {
      if (PRERELEASE.test(range)) {
        fail(`${name}@${range} is a prerelease`, file);
      }
    }
  }
}

console.log(`Checked ${String(manifests.length)} manifests for prerelease dependencies.`);

let lockfile;
try {
  lockfile = readFileSync('pnpm-lock.yaml', 'utf8');
} catch {
  console.log('No pnpm-lock.yaml yet; skipping lockfile checks.');
  process.exitCode = failures === 0 ? 0 : 1;
  process.exit();
}

const internalHosts = lockfile.split('\n').filter((line) => INTERNAL_HOST.test(line));
if (internalHosts.length > 0) {
  fail(
    `pnpm-lock.yaml resolves ${String(internalHosts.length)} package(s) through an internal registry mirror. ` +
      'Regenerate it on a machine with public npm access, or via the bootstrap-lockfile workflow.',
    'pnpm-lock.yaml',
  );
}

const weakHashes = lockfile.match(/integrity: sha1-/g) ?? [];
if (weakHashes.length > 0) {
  fail(
    `pnpm-lock.yaml contains ${String(weakHashes.length)} SHA-1 integrity hash(es); the public registry issues SHA-512.`,
    'pnpm-lock.yaml',
  );
}

if (failures === 0) {
  console.log('Lockfile is portable: no internal hosts, no SHA-1 integrity hashes.');
}

process.exitCode = failures === 0 ? 0 : 1;
