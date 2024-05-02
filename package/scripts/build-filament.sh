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

target="debug"

# On iOS, we already use Filament from CocoaPods.
echo "Building Filament for iOS ($target)..."
# -s = iOS simulator support
# -l = Build fat universal library (x86_64 + arm64), needed to easily include library from podspec
./build.sh -s -l -p ios -i "$target"

echo "Copying Filament iOS libraries to react-native-filament..."
rm -rf ../package/ios/libs/filament
mkdir -p ../package/ios/libs/filament
cp -rf out/ios-$target/filament ../package/ios/libs
# Rename math.h file to avoid conflicts with <math.h> system header (the header doesn't seem to be used anywhere).
mv ../package/ios/libs/filament/include/gltfio/math.h ../package/ios/libs/filament/include/gltfio/gltfio-math.h

# TODO(Marc): Use Filament from the Maven/Gradle library, to avoid shipping this huge dependency over npm.
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
cp -rf out/android-$target/filament ../package/android/libs

echo "Done!"
