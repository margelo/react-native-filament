#!/bin/bash
set -euo pipefail

# Compiles materials/*.mat with matc from the Filament release pinned in filament.json and embeds each one as cpp/materials/<Name>Package.hpp.
package=$(cd "$(dirname "$0")/.." && pwd)
version=$(node -p "require('$package/filament.json').version")
matc=${MATC:-$(command -v matc || true)}
if [ -z "$matc" ]; then
  echo "matc $version is required: set MATC or put the bin folder of filament-v$version-mac.tgz on PATH." >&2
  exit 1
fi

work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT
for source in "$package"/materials/*.mat; do
  base=$(basename "${source%.mat}")
  name=$(echo "$base" | perl -pe 's/(^|_)(\w)/\U$2/g')
  "$matc" --platform mobile --api all -o "$work/$base.filamat" "$source"
  {
    echo "#pragma once"
    echo
    echo "#include <cstdint>"
    echo
    echo "namespace margelo::nitro::filament {"
    echo
    echo "inline constexpr uint8_t k${name}MaterialPackage[] = {"
    xxd -i < "$work/$base.filamat"
    echo "};"
    echo
    echo "} // namespace margelo::nitro::filament"
  } > "$package/cpp/materials/${name}MaterialPackage.hpp"
done
