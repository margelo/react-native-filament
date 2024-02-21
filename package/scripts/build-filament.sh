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

echo "Building Filament for iOS and Android ($mode)..."
# -p = platforms
# -s = iOS simulator support
./build.sh -p ios,android "$mode" -s

echo "Done!"
