#!/bin/bash

set -e

if [ -d "../package/android/libs/bullet3" ]; then
  echo "[bullet3] Android libraries already exist in react-native-filament package. Do you want to skip building them? (Y/N) (y)"
  read -r skip_android
  if [ "$skip_android" = "N" ] || [ "$skip_android" = "n" ]; then
    skip_android=false
  else
    echo "Skipping Android build..."
    skip_android=true
  fi
fi

if [ -d "../package/ios/libs/bullet3" ]; then
  echo "[bullet3] iOS libraries already exist in react-native-filament package. Do you want to skip building them? (Y/N) (y)"
  read -r skip_ios
  if [ "$skip_ios" = "N" ] || [ "$skip_ios" = "n" ]; then
    skip_ios=false
  else
    echo "Skipping iOS build..."
    skip_ios=true
  fi
fi

if [ "$skip_ios" = true ] && [ "$skip_android" = true ]; then
  echo "[bullet3] Both iOS and Android libraries already exist. Nothing to do."
  exit 0
fi


PACKAGE_DIR=$(pwd)

#############
#  Android  #
#############

rm -rf ../package/android/libs/bullet3
mkdir -p ../package/android/libs/bullet3
mkdir -p ../package/android/libs/bullet3/lib
mkdir -p ../package/android/libs/bullet3/include

TARGET_SDK="$(grep '^Filament_targetSdkVersion' ./android/gradle.properties | cut -d'=' -f2)"
ANDROID_NDK_VERSION="$(grep '^Filament_ndkversion' ./android/gradle.properties | cut -d'=' -f2)"

echo "Using target SDK: $TARGET_SDK"
echo "Using NDK version: $ANDROID_NDK_VERSION"

# We need to copy over the updated BulletAndroid.mk file, since theirs is outdated
cp -f scripts/BulletAndroidApplication.mk ../bullet3/build3/Android/jni/Application.mk
# Change the {PLATFORM_NAME} to the actual platform value from gradle.properties
sed -i '' "s/{PLATFORM_NAME}/$TARGET_SDK/g" ../bullet3/build3/Android/jni/Application.mk

cd ../bullet3/build3/Android/jni
# Build the Bullet3 library
$ANDROID_HOME/ndk/$ANDROID_NDK_VERSION/ndk-build

# Copy the built library to the package
cp -rf ../obj/local/* ../../../../package/android/libs/bullet3/lib

# Clean all changes in bullet3 (the build files are not under gitignore)
git checkout .  # Discard all uncommitted changes
rm -rf ../obj/  # Remove untracked files and directories 

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

#############
#    iOS    #
#############

cd $PACKAGE_DIR

# For iOS we only need to copy the source files over (this is the recommended approach by bullet3):
rm -rf ./ios/libs/bullet3
mkdir -p ./ios/libs/bullet3
cp -rf ../bullet3/src/* ./ios/libs/bullet3

# We need to remove the OpenCL folder as it is not supported on iOS
rm -rf ./ios/libs/bullet3/Bullet3OpenCL