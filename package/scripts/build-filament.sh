#!/bin/bash

sleep 1
cd "$(dirname "$0")"
cd ..
cd ..
cd filament

target="release"
echo "Building Filament for iOS and Android ($target)..."
# -p = platforms
# -s = iOS simulator support
./build.sh -p ios,android "$target" -s

echo "Done!"
