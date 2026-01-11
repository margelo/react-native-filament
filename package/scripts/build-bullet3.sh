#!/bin/bash

set -e

# Parse command-line arguments
BUILD_ANDROID=${BUILD_ANDROID:-true}
BUILD_IOS=${BUILD_IOS:-true}

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
          echo "Usage: $0 [--platform android|ios|all]"
          exit 1
          ;;
      esac
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      echo "Usage: $0 [--platform android|ios|all]"
      exit 1
      ;;
  esac
done

# Interactive mode: ask to skip if libraries already exist (only if not in CI)
if [ "$CI" != "true" ]; then
  if [ "$BUILD_ANDROID" = "true" ] && [ -d "../package/android/libs/bullet3" ]; then
    echo "[bullet3] Android libraries already exist in react-native-filament package. Do you want to skip building them? (Y/N) (y)"
    read -r skip_android
    if [ "$skip_android" = "N" ] || [ "$skip_android" = "n" ]; then
      BUILD_ANDROID=true
    else
      echo "Skipping Android build..."
      BUILD_ANDROID=false
    fi
  fi

  if [ "$BUILD_IOS" = "true" ] && [ -d "../package/ios/libs/bullet3" ]; then
    echo "[bullet3] iOS libraries already exist in react-native-filament package. Do you want to skip building them? (Y/N) (y)"
    read -r skip_ios
    if [ "$skip_ios" = "N" ] || [ "$skip_ios" = "n" ]; then
      BUILD_IOS=true
    else
      echo "Skipping iOS build..."
      BUILD_IOS=false
    fi
  fi
fi

if [ "$BUILD_IOS" = "false" ] && [ "$BUILD_ANDROID" = "false" ]; then
  echo "[bullet3] Both iOS and Android builds are skipped. Nothing to do."
  exit 0
fi


PACKAGE_DIR=$(pwd)

#############
#  Android  #
#############

if [ "$BUILD_ANDROID" = "true" ]; then
  echo "[bullet3] Building Android libraries..."

  rm -rf ../package/android/libs/bullet3
  mkdir -p ../package/android/libs/bullet3
  mkdir -p ../package/android/libs/bullet3/lib
  mkdir -p ../package/android/libs/bullet3/include

  TARGET_SDK="$(grep '^Filament_targetSdkVersion' ./android/gradle.properties | cut -d'=' -f2)"
  ANDROID_NDK_VERSION="$(grep '^Filament_ndkversion' ./android/gradle.properties | cut -d'=' -f2)"

  echo "Using target SDK: $TARGET_SDK"
  echo "Using NDK version: $ANDROID_NDK_VERSION"

  # We need to copy over the updated Bullet Android build files for NDK 27 compatibility
  cp -f scripts/BulletAndroidApplication.mk ../bullet3/build3/Android/jni/Application.mk
  cp -f scripts/BulletAndroid.mk ../bullet3/build3/Android/jni/Android.mk
  # Change the {PLATFORM_NAME} to the actual platform value from gradle.properties
  # Use portable sed syntax (works on both macOS and Linux)
  if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "s/{PLATFORM_NAME}/$TARGET_SDK/g" ../bullet3/build3/Android/jni/Application.mk
  else
    sed -i "s/{PLATFORM_NAME}/$TARGET_SDK/g" ../bullet3/build3/Android/jni/Application.mk
  fi

  # Temporarily rename VERSION file to avoid conflicts with C++ standard library headers
  # (NDK 27+ includes <version> header which conflicts with bullet3's VERSION file)
  if [ -f ../bullet3/VERSION ]; then
    mv ../bullet3/VERSION ../bullet3/VERSION.tmp
  fi

  cd ../bullet3/build3/Android/jni
  # Build the Bullet3 library
  $ANDROID_HOME/ndk/$ANDROID_NDK_VERSION/ndk-build

  # Copy the built library to the package
  cp -rf ../obj/local/* ../../../../package/android/libs/bullet3/lib

  # Clean all changes in bullet3 (the build files are not under gitignore)
  git checkout .  # Discard all uncommitted changes
  rm -rf ../obj/  # Remove untracked files and directories

  # Restore VERSION file if it was renamed
  if [ -f ../../../../bullet3/VERSION.tmp ]; then
    mv ../../../../bullet3/VERSION.tmp ../../../../bullet3/VERSION
  fi

  # Remove the objs folder
  cd ../../../../package/android/libs/bullet3/lib
  rm -rf arm64-v8a/objs
  rm -rf armeabi-v7a/objs
  rm -rf x86/objs
  rm -rf x86_64/objs

  # Copy over all headers
  cd $PACKAGE_DIR
  cp -rf ../bullet3/src/* android/libs/bullet3/include
  cd android/libs/bullet3/include
  # Remove all .cpp, .lua and .txt files
  find . -type f -name "*.cpp" -delete
  find . -type f -name "*.lua" -delete
  find . -type f -name "*.txt" -delete

  echo "[bullet3] Android libraries built successfully!"
fi

#############
#    iOS    #
#############

if [ "$BUILD_IOS" = "true" ]; then
  echo "[bullet3] Building iOS libraries..."

  cd $PACKAGE_DIR

  # For iOS we only need to copy the source files over (this is the recommended approach by bullet3):
  rm -rf ./ios/libs/bullet3
  mkdir -p ./ios/libs/bullet3
  cp -rf ../bullet3/src/* ./ios/libs/bullet3

  # We need to remove the OpenCL folder as it is not supported on iOS
  rm -rf ./ios/libs/bullet3/Bullet3OpenCL

  echo "[bullet3] iOS libraries built successfully!"
fi