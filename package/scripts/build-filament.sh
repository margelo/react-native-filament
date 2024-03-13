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

# On iOS, we already use Filament from CocoaPods.
echo "Building Filament for iOS ($target)..."
# -s = iOS simulator support
# -l = Build fat universal library (x86_64 + arm64)
# -c = Cleans out the cmake build directory
# -l = Build fat universal library (x86_64 + arm64), needed to easily include library from podspec
./build.sh -s -p ios -i "$target" -l

echo "Copying Filament iOS libraries to react-native-filament..."
rm -rf ../package/ios/libs/filament
mkdir -p ../package/ios/libs/filament
cp -rf out/ios-release/filament ../package/ios/libs

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
