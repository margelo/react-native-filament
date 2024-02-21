#!/bin/bash

mode=$1
if [ "$mode" = 'debug' ] || [ "$mode" = 'release' ]; then
  echo "Building Filament core library for $mode.."
else
  echo "Invalid parameter '$mode' - first parameter needs to be either 'debug' or 'release'!"
  exit 1
fi

sleep 1
cd "$(dirname "$0")"
cd ..
cd ..
cd filament

echo "Building iOS ($mode)..."
./build.sh -p ios "$mode"

echo "Building Android ($mode)..."
./build.sh -p android "$mode"

echo "Done!"
