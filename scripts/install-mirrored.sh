#!/usr/bin/env sh
# Installs dependencies on a machine whose npm registry is an internal mirror
# that lags the public one.
#
# pnpm-lock.yaml is resolved in CI against the public registry and is the source
# of truth for CI and production. The mirror does not carry every version in it,
# so local installs resolve fresh and the portable lockfile is restored
# afterwards. CI rejects any lockfile carrying internal hosts, so a mirrored
# resolution can never be merged.
#
# To ADD a dependency: edit the package.json by hand and run this. `pnpm add`
# fails here because it reconciles the whole portable lockfile against the
# mirror, which does not carry every pinned version.
set -u

rm -f pnpm-lock.yaml
pnpm install
exit_code=$?

git checkout -- pnpm-lock.yaml 2>/dev/null || true

if [ "$exit_code" -ne 0 ]; then
  echo "install failed; portable lockfile restored" >&2
fi

exit "$exit_code"
