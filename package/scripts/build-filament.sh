#!/bin/bash

echo "Did you set up your development tools properly?"
echo "Did you set up your development tools properly?"
echo "Did you set up your development tools properly?"
echo "Did you set up your development tools properly?"
echo "Did you set up your development tools properly?"
echo "https://github.com/google/filament/blob/main/BUILDING.md"

sleep 1
cd "$(dirname "$0")"
cd ..
cd ..
cd filament

target="release"

echo "Preparing desktop tools for macOS... (matc, resgen, etc)"
./build.sh -p desktop -i release

echo "Building Filament for iOS and Android ($target)..."
# -p = platforms
# -s = iOS simulator support
# -v = Disable Vulkan support on Android (we only need OpenGL)
./build.sh -p ios,android -v -i "$target" -s

echo "Done!"
