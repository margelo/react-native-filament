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
# -l = Build fat universal library (x86_64 + arm64)
# -c = Cleans out the cmake build directory
# -l = Build fat universal library (x86_64 + arm64), needed to easily include library from podspec
./build.sh -s -p ios -i "$target" -c -l

echo "Copying Filament iOS libraries to react-native-filament..."
rm -rf ../package/ios/libs/filament
mkdir -p ../package/ios/libs/filament
cp -rf out/ios-release/filament ../package/ios/libs

# TODO(marc): Figure out how we can disable filamat to save binary size here.

echo "Building Filament for Android ($target)"
# -v = Exclude Vulkan support
./build.sh -p android "$target"

# echo "Building Android .aar ($target)..."
# cd android
# ./gradlew -Pcom.google.android.filament.dist-dir=../out/android-release/filament assembleRelease
# cd ..

echo "Copying Filament Android libraries to react-native-filament..."
rm -rf ../package/android/libs/filament
mkdir -p ../package/android/libs/filament
cp -rf out/android-release/filament ../package/android/libs

echo "Done!"
