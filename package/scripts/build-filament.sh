#!/bin/bash

set -e

target="$1"
if [ -z "$target" ]; then
  # Exit and print error message
    echo "Missing build type (debug|release)"
    echo "Usage: $0 <buildType>"
    exit 1
fi

# Check if the library exists for ios, if so, ask to skip with Y/N question
if [ -d "../package/ios/libs/filament" ]; then
  echo "[Filament] iOS libraries already exist in react-native-filament package. Do you want to skip building them? (Y/N) (y)"
  read -r skip_ios
  if [ "$skip_ios" = "N" ] || [ "$skip_ios" = "n" ]; then
    skip_ios=false
  else
    echo "Skipping iOS build..."
    skip_ios=true
  fi
fi
# Same for android:
if [ -d "../package/android/libs/filament" ]; then
  echo "[Filament] Android libraries already exist in react-native-filament package. Do you want to skip building them? (Y/N) (y)"
  read -r skip_android
  if [ "$skip_android" = "N" ] || [ "$skip_android" = "n" ]; then
    skip_android=false
  else
    echo "Skipping Android build..."
    skip_android=true
  fi
fi

if [ "$skip_ios" = true ] && [ "$skip_android" = true ]; then
  echo "Both iOS and Android libraries already exist. Nothing to do."
  exit 0
fi

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

if [ "$skip_ios" = false ]; then
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
fi

if [ "$skip_android" = false ]; then
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
fi

echo "Done!"
