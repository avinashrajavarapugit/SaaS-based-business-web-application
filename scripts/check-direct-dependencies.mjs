// Guards against the internal npm mirror serving prerelease builds as `latest`.
// Only direct dependencies are checked; some transitive packages legitimately
// publish prerelease versions as their stable line.
import { globSync, readFileSync } from 'node:fs';

const PRERELEASE = /-(alpha|beta|rc|canary|next|dev|integration)/i;

const manifests = [
  'package.json',
  ...globSync('apps/*/package.json'),
  ...globSync('packages/*/package.json'),
];

let found = 0;

for (const file of manifests) {
  const pkg = JSON.parse(readFileSync(file, 'utf8'));

  for (const field of ['dependencies', 'devDependencies']) {
    for (const [name, range] of Object.entries(pkg[field] ?? {})) {
      if (PRERELEASE.test(range)) {
        console.log(`::error file=${file}::${name}@${range} is a prerelease`);
        found += 1;
      }
    }
  }
}

console.log(
  found === 0
    ? `Checked ${String(manifests.length)} manifests: all direct dependencies are stable.`
    : `${String(found)} prerelease direct dependency(ies) found.`,
);

process.exitCode = found === 0 ? 0 : 1;
