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
  -DFILAMENT_ENABLE_LTO=ON \ # Enable link-time optimizations if supported by the compiler
  -DFILAMENT_BUILD_FILAMAT=OFF \ # Build filamat and JNI buildings
  -DFILAMENT_SUPPORTS_OPENGL=ON \ # Include the OpenGL backend
  -DFILAMENT_SUPPORTS_METAL=OFF \ # Include the Metal backend
  -DFILAMENT_SUPPORTS_VULKAN=OFF \ # Include the Vulkan backend
  -DFILAMENT_INSTALL_BACKEND_TEST=OFF \ # Install the backend test library so it can be consumed on iOS
  -DFILAMENT_USE_EXTERNAL_GLES3=OFF \ # Experimental: Compile Filament against OpenGL ES 3
  -DFILAMENT_USE_SWIFTSHADER=OFF \ # Compile Filament against SwiftShader
  -DFILAMENT_SKIP_SAMPLES=ON \ # Don't build sample apps
  -DCMAKE_TOOLCHAIN_FILE=../../build/toolchain-aarch64-linux-android.cmake \
  -DCMAKE_BUILD_TYPE=Release \
  -DCMAKE_INSTALL_PREFIX=../android-release/filament \
  ../..
ninja install/strip

echo "Done!"
