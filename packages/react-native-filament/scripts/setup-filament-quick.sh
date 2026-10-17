#!/bin/bash

set -e

# Parse version argument (default: "latest")
VERSION="${1:-latest}"

echo "[Filament Quick Setup] Setting up Filament libraries from npm package (version: $VERSION)..."

# Check prerequisites
if ! command -v npm &> /dev/null; then
    echo "Error: npm is not installed. Please install Node.js and npm first."
    exit 1
fi

if ! command -v tar &> /dev/null; then
    echo "Error: tar is not installed."
    exit 1
fi

# Navigate to script directory
cd "$(dirname "$0")"
SCRIPT_DIR=$(pwd)

# Check if the library exists for ios, if so, ask to skip with Y/N question
skip_ios=false
skip_android=false

if [ -d "../ios/libs/filament" ]; then
  echo "[Filament] iOS libraries already exist in react-native-filament package. Do you want to skip downloading them? (Y/N) (y)"
  read -r skip_ios_input
  if [ "$skip_ios_input" = "N" ] || [ "$skip_ios_input" = "n" ]; then
    skip_ios=false
  else
    echo "Skipping iOS libraries..."
    skip_ios=true
  fi
fi

# Same for android:
if [ -d "../android/libs/filament" ]; then
  echo "[Filament] Android libraries already exist in react-native-filament package. Do you want to skip downloading them? (Y/N) (y)"
  read -r skip_android_input
  if [ "$skip_android_input" = "N" ] || [ "$skip_android_input" = "n" ]; then
    skip_android=false
  else
    echo "Skipping Android libraries..."
    skip_android=true
  fi
fi

if [ "$skip_ios" = true ] && [ "$skip_android" = true ]; then
  echo "Both iOS and Android libraries already exist. Nothing to do."
  exit 0
fi

# Create temporary directory with cleanup trap
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

echo "[Filament Quick Setup] Downloading react-native-filament@$VERSION from npm..."
cd "$TEMP_DIR"

# Download the npm package
if ! npm pack react-native-filament@"$VERSION"; then
    echo "Error: Failed to download react-native-filament@$VERSION from npm."
    echo "Please check that the version exists and you have network connectivity."
    exit 1
fi

# Extract the tarball
echo "[Filament Quick Setup] Extracting package..."
tar -xzf react-native-filament-*.tgz

if [ ! -d "package" ]; then
    echo "Error: Failed to extract package. Expected 'package/' directory not found."
    exit 1
fi

# Copy Android libraries if not skipped
if [ "$skip_android" = false ]; then
  echo "[Filament Quick Setup] Copying Android libraries..."

  if [ ! -d "package/android/libs/filament" ]; then
    echo "Error: Android libraries not found in downloaded package."
    exit 1
  fi

  # Remove old libraries and copy new ones
  rm -rf "$SCRIPT_DIR/../android/libs/filament"
  mkdir -p "$SCRIPT_DIR/../android/libs"
  cp -rf package/android/libs/filament "$SCRIPT_DIR/../android/libs/"

  # Verify critical architectures exist
  for arch in armeabi-v7a arm64-v8a x86 x86_64; do
    if [ ! -d "$SCRIPT_DIR/../android/libs/filament/lib/$arch" ]; then
      echo "Warning: Android architecture $arch not found in downloaded package."
    fi
  done

  echo "[Filament Quick Setup] Android libraries copied successfully."
fi

# Copy iOS libraries if not skipped
if [ "$skip_ios" = false ]; then
  echo "[Filament Quick Setup] Copying iOS libraries..."

  if [ ! -d "package/ios/libs/filament" ]; then
    echo "Error: iOS libraries not found in downloaded package."
    exit 1
  fi

  # Remove old libraries and copy new ones
  rm -rf "$SCRIPT_DIR/../ios/libs/filament"
  mkdir -p "$SCRIPT_DIR/../ios/libs"
  cp -rf package/ios/libs/filament "$SCRIPT_DIR/../ios/libs/"

  # Rename math.h file to avoid conflicts with <math.h> system header
  if [ -f "$SCRIPT_DIR/../ios/libs/filament/include/gltfio/math.h" ]; then
    mv "$SCRIPT_DIR/../ios/libs/filament/include/gltfio/math.h" \
       "$SCRIPT_DIR/../ios/libs/filament/include/gltfio/gltfio-math.h"
    echo "[Filament Quick Setup] Renamed gltfio/math.h to gltfio/gltfio-math.h"
  fi

  # Verify some critical frameworks exist
  critical_frameworks=("libfilament.xcframework" "libbackend.xcframework" "libutils.xcframework")
  for fw in "${critical_frameworks[@]}"; do
    if [ ! -d "$SCRIPT_DIR/../ios/libs/filament/lib/$fw" ]; then
      echo "Warning: iOS framework $fw not found in downloaded package."
    fi
  done

  echo "[Filament Quick Setup] iOS libraries copied successfully."
fi

echo ""
echo "[Filament Quick Setup] Done! Filament libraries have been set up from react-native-filament@$VERSION"
echo ""
