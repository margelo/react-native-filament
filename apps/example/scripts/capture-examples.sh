#!/bin/bash
set -euo pipefail

# Cold-launches each example through its rnfexample:// link and saves a screenshot per platform.
# Usage: scripts/capture-examples.sh <ios|android|all> <output-directory> [seconds] [Route ...]
platform=$1
output=$2
seconds=${3:-8}
shift $(( $# >= 3 ? 3 : $# ))
routes=("$@")
if [ ${#routes[@]} -eq 0 ]; then
  routes=($(node -e "console.log(require('fs').readFileSync('$(dirname "$0")/../../shared/src/examples.ts', 'utf8').match(/route: '([A-Za-z]+)'/g).map((m) => m.slice(8, -1)).join(' '))"))
fi
simulator=${RNF_IOS_SIMULATOR_ID:-booted}
adb=${ANDROID_HOME:-$HOME/Library/Android/sdk}/platform-tools/adb
mkdir -p "$output"

capture_ios() {
  xcrun simctl terminate "$simulator" org.reactjs.native.example.AppExampleFabric 2>/dev/null || true
  xcrun simctl openurl "$simulator" "rnfexample://$1"
  sleep "$seconds"
  xcrun simctl io "$simulator" screenshot "$output/ios-$1.png" >/dev/null
}

capture_android() {
  "$adb" shell am force-stop com.appexamplefabric
  "$adb" shell am start -W -a android.intent.action.VIEW -d "rnfexample://$1" com.appexamplefabric >/dev/null
  sleep "$seconds"
  "$adb" exec-out screencap -p > "$output/android-$1.png"
}

for route in "${routes[@]}"; do
  if [ "$platform" = ios ] || [ "$platform" = all ]; then capture_ios "$route"; fi
  if [ "$platform" = android ] || [ "$platform" = all ]; then capture_android "$route"; fi
  echo "captured $route"
done
