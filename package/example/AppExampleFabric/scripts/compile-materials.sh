#!/bin/bash

set -e

# Make sure the filament matc tool is available:
matc_path=../../../filament/out/cmake-release/tools/matc/matc
if [ ! -f "$matc_path" ]; then
  echo "The filament matc tool is missing. Did you build Filament properly?"
  exit 1
fi

# Loop through all files in ./assets that have a .mat extension
for file in ./assets/*.mat; do
  # Extract the filename without the extension
  filename=$(basename -- "$file")
  compiled_filename="${filename%.*}.filamat"
  echo "Compiling $file to $compiled_filename"
  # Compile the material
  $matc_path --platform mobile --api all -o ."/assets/$compiled_filename" "$file"
done