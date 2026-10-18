#!/bin/bash
set -euo pipefail

# Compiles apps/shared/assets/*.mat with matc from the Filament release pinned in filament.json.
root=$(cd "$(dirname "$0")/../../.." && pwd)
version=$(node -p "require('$root/packages/react-native-filament/filament.json').version")
matc=${MATC:-$(command -v matc || true)}
if [ -z "$matc" ]; then
  echo "matc $version is required: set MATC or put the bin folder of filament-v$version-mac.tgz on PATH." >&2
  exit 1
fi

for source in "$root"/apps/shared/assets/*.mat; do
  "$matc" --platform mobile --api all -o "${source%.mat}.filamat" "$source"
done
