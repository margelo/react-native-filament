#!/bin/bash

set -e

# Default values
BUILD_ANDROID=${BUILD_ANDROID:-true}
BUILD_IOS=${BUILD_IOS:-true}
target=""

# Parse command-line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --platform)
      case $2 in
        android)
          BUILD_ANDROID=true
          BUILD_IOS=false
          ;;
        ios)
          BUILD_ANDROID=false
          BUILD_IOS=true
          ;;
        all)
          BUILD_ANDROID=true
          BUILD_IOS=true
          ;;
        *)
          echo "Unknown platform: $2"
          echo "Usage: $0 [debug|release] [--platform android|ios|all]"
          exit 1
          ;;
      esac
      shift 2
      ;;
    debug|release)
      target=$1
      shift
      ;;
    *)
      echo "Unknown option: $1"
      echo "Usage: $0 [debug|release] [--platform android|ios|all]"
      exit 1
      ;;
  esac
done

# Validate build type
if [ -z "$target" ]; then
  echo "Missing build type (debug|release)"
  echo "Usage: $0 [debug|release] [--platform android|ios|all]"
  exit 1
fi

# Interactive mode: ask to skip if libraries already exist (only if not in CI)
if [ "$CI" != "true" ]; then
  if [ "$BUILD_IOS" = "true" ] && [ -d "../package/ios/libs/filament" ]; then
    echo "[Filament] iOS libraries already exist in react-native-filament package. Do you want to skip building them? (Y/N) (y)"
    read -r skip_ios
    if [ "$skip_ios" = "N" ] || [ "$skip_ios" = "n" ]; then
      BUILD_IOS=true
    else
      echo "Skipping iOS build..."
      BUILD_IOS=false
    fi
  fi

  if [ "$BUILD_ANDROID" = "true" ] && [ -d "../package/android/libs/filament" ]; then
    echo "[Filament] Android libraries already exist in react-native-filament package. Do you want to skip building them? (Y/N) (y)"
    read -r skip_android
    if [ "$skip_android" = "N" ] || [ "$skip_android" = "n" ]; then
      BUILD_ANDROID=true
    else
      echo "Skipping Android build..."
      BUILD_ANDROID=false
    fi
  fi
fi

if [ "$BUILD_IOS" = "false" ] && [ "$BUILD_ANDROID" = "false" ]; then
  echo "[Filament] Both iOS and Android builds are skipped. Nothing to do."
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

if [ "$BUILD_IOS" = "true" ]; then
  # On iOS, we already use Filament from CocoaPods.
  echo "[Filament] Building Filament for iOS ($target)..."
  # -s = iOS simulator support
  # -l = Build fat universal library (x86_64 + arm64), needed to easily include library from podspec
  ./build.sh -s -l -p ios -i "$target"

  echo "Copying Filament iOS libraries to react-native-filament..."
  rm -rf ../package/ios/libs/filament
  mkdir -p ../package/ios/libs/filament
  cp -rf out/ios-$target/filament ../package/ios/libs
  # Rename math.h file to avoid conflicts with <math.h> system header (the header doesn't seem to be used anywhere).
  mv ../package/ios/libs/filament/include/gltfio/math.h ../package/ios/libs/filament/include/gltfio/gltfio-math.h

  # Copy private backend headers needed for JNI initialization
  echo "Copying Filament private backend headers..."
  mkdir -p ../package/ios/libs/filament/include/private/backend
  cp filament/backend/include/private/backend/VirtualMachineEnv.h ../package/ios/libs/filament/include/private/backend/

  echo "[Filament] iOS libraries built successfully!"
fi

if [ "$BUILD_ANDROID" = "true" ]; then
  # TODO(Marc): Use Filament from the Maven/Gradle library, to avoid shipping this huge dependency over npm.
  echo "[Filament] Building Filament for Android ($target)"
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

  # Copy private backend headers needed for JNI initialization
  echo "Copying Filament private backend headers..."
  mkdir -p ../package/android/libs/filament/include/private/backend
  cp filament/backend/include/private/backend/VirtualMachineEnv.h ../package/android/libs/filament/include/private/backend/

  echo "[Filament] Android libraries built successfully!"
fi

echo "Done!"
