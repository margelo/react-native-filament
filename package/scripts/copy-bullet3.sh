#!/bin/bash

set -e

# TODO: Only copy header files?

# Android
rm -rf ../package/android/libs/bullet3
mkdir -p ../package/android/libs/bullet3
cp -rf ../bullet3/src/* ../package/android/libs/bullet3

# iOS
rm -rf ../package/ios/libs/bullet3
mkdir -p ../package/ios/libs/bullet3
cp -rf ../bullet3/src/* ../package/ios/libs/bullet3
