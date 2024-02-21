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
./build.sh -s -p ios -i "$target"

echo "Copying Filament iOS libraries to react-native-filament..."
rm -rf ../package/ios/libs/filament
mkdir -p ../package/ios/libs/filament
cp -rf out/ios-release/filament ../package/ios/libs

# TODO(marc): Figure out how we can disable filamat to save binary size here.

echo "Building Filament for Android ($target)"
mkdir -p out/android-build-release-aarch64
cd out/android-build-release-aarch64
cmake -G Ninja \
  -DFILAMENT_ENABLE_LTO=ON \
  -DFILAMENT_BUILD_FILAMAT=ON \
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
cd ../..

# echo "Building Android .aar ($target)..."
# cd android
# ./gradlew -Pcom.google.android.filament.dist-dir=../out/android-release/filament assembleRelease
# cd ..

echo "Copying Filament Android libraries to react-native-filament..."
rm -rf ../package/android/libs/filament
mkdir -p ../package/android/libs/filament
cp -rf out/android-release/filament ../package/android/libs

echo "Done!"
