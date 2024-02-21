#!/bin/bash

set -e

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


echo "Building Filament for iOS ($target)..."
# -s = iOS simulator support
./build.sh -s -p ios "$target"

echo "Building Filament for Android ($target)"
mkdir -p out/android-build-release-aarch64
cd out/android-build-release-aarch64
cmake -G Ninja \
  -DFILAMENT_ENABLE_LTO=ON \
  -DFILAMENT_BUILD_FILAMAT=OFF \
  -DFILAMENT_SUPPORTS_OPENGL=ON \
  -DFILAMENT_SUPPORTS_METAL=OFF \
  -DFILAMENT_SUPPORTS_VULKAN=OFF \
  -DFILAMENT_USE_EXTERNAL_GLES3=OFF \
  -DFILAMENT_USE_SWIFTSHADER=OFF \
  -DFILAMENT_SKIP_SAMPLES=ON \
  -DCMAKE_TOOLCHAIN_FILE=../../build/toolchain-aarch64-linux-android.cmake \
  -DCMAKE_BUILD_TYPE=Release \
  -DCMAKE_INSTALL_PREFIX=../android-release/filament \
  ../..
ninja install/strip

echo "Done!"
