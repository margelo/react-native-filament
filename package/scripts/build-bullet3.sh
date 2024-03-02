#!/bin/bash

set -e

#############
#  Android  #
#############

PACKAGE_DIR=$(pwd)

rm -rf ../package/android/libs/bullet3
mkdir -p ../package/android/libs/bullet3
mkdir -p ../package/android/libs/bullet3/lib
mkdir -p ../package/android/libs/bullet3/include

# # We need to copy over the Updated BulletAndroid.mk file
cp -f scripts/BulletAndroidApplication.mk ../bullet3/build3/Android/jni/Application.mk

cd ../bullet3/build3/Android/jni
ANDROID_NDK_VERSION="24.0.8215888" # This version supports arm64 architecture (apple silicon), make sure its installed on your system
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