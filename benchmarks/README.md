# Benchmarks

Compares react-native-filament 1.11 (the release on npm, JSI and worklets-core) with the Nitro rewrite on the same React Native 0.83, Reanimated 4 and example app, in Release builds. On Android, 1.x renders with OpenGL ES; Nitro runs once with its default Vulkan backend and once with OpenGL ES.

Results: [RESULTS.md](./RESULTS.md).

## Findings

Measured on a Samsung Galaxy F14 (Exynos 1330, Mali-G68, 90 Hz) and the iPhone 17 simulator on an M5 Max.

- **Heavy scenes render much faster on the phone.** 100 animated drones render at 28 fps on Vulkan (23 on OpenGL) against 14 with 1.x, and 200 physics coins at 83 fps (76) against 49. With 1.x, the JS and UI threads also drop to about 72 fps with the drones; with Nitro they stay at 90.
- **Less CPU per frame.** On the phone, Nitro spends 22–59% less CPU per rendered frame than 1.x on Vulkan, and 21–45% less on OpenGL except with the drones (+13%). On the simulator, the drones take 31% less CPU and the other scenes are within 10%.
- **On-demand rendering removes the idle cost.** A static scene with `renderMode="on-demand"` takes 1.5–6% CPU instead of 13–42%; 1.x has no such mode.
- **Memory is the cost.** Nitro uses about 37 MB more on the simulator (its render-thread JS runtime and Nitro objects). On the phone, Vulkan uses 290–430 MB more than OpenGL in the drone scenes; on OpenGL, Nitro is between 10% below and 22% above 1.x. With 100 drones, 1.x was killed once at launch.
- The simulator reaches 60 fps everywhere for both versions, so on iOS only CPU and memory separate them.
- **Known limit: an idle on-demand scene keeps its last load's upload memory.** Filament frees released upload buffers in a later flush and evicts staging buffers only at frame boundaries, so a scene that stops rendering right after loading keeps them until it renders again: 404 MB against 98 MB on the simulator. Freeing it reliably needs a GPU-completion signal on every backend; a 1×1 `readPixels` after the upload crashed Filament's Vulkan readback, so this is left for a follow-up.

## Scenes

The `Benchmarks` section of the example app holds one screen per scene. Each screen draws the scene full screen and logs one `RNFBENCH` line per second.

| Route | Scene | Stresses |
|---|---|---|
| `rnfexample://benchstatic` | One model that never changes, rendered every frame | Frame loop overhead |
| `rnfexample://benchstaticondemand` | The same model with `renderMode="on-demand"` (1.x has no on-demand mode: it renders every frame unless the app pauses the view) | Idle cost |
| `rnfexample://benchanimated` | One model playing its glTF animation | Animator per frame |
| `rnfexample://benchinstances` | 100 instances of an animated drone | GPU and animator load |
| `rnfexample://benchrotations` | 400 coin instances, each rotated by render-thread JS every frame | JS to native calls per frame |
| `rnfexample://benchphysics` | 200 coins falling onto a floor with Bullet, never sleeping | Physics step and transform sync |

## Metrics

- **Render FPS**: frames Filament actually rendered, counted by a frame callback on the render thread.
- **JS FPS**: `requestAnimationFrame` callbacks on the React Native JS runtime.
- **UI FPS**: Reanimated frame callbacks on the UI runtime.
- **CPU**: the whole app process. On Android it is the sum of `/proc/<pid>/task/*/stat` deltas, broken down per thread; on iOS it is the `ps` CPU time delta. 100% is one core.
- **Memory**: total PSS from `dumpsys meminfo` on Android and the physical footprint from `footprint` on iOS, at the end of the measurement window.

Each FPS value is the average of all one-second samples, with the worst second in parentheses.

## Running

1. Build and install the example app in Release:

   ```sh
   cd apps/example/android && ./gradlew :app:createBundleReleaseJsAndAssets --rerun :app:installRelease -PreactNativeArchitectures=arm64-v8a
   ```

   ```sh
   cd apps/example/ios && xcodebuild -workspace AppExampleFabric.xcworkspace -scheme AppExampleFabric -configuration Release -sdk iphonesimulator -derivedDataPath build
   ```

2. Run the scenes and write `results/<platform>-<version>[-<backend>].json`:

   ```sh
   bun benchmarks/run.ts --platform android --version v2 --backend vulkan
   ```

   `--backend vulkan` opens the scenes with `?backend=vulkan` and adds the backend to the file name. `--runs`, `--warmup` and `--measure` (seconds) change the defaults of 2 runs, 10 s and 20 s; `--scenes benchphysics,benchrotations` limits the scenes. `RNF_SIMULATOR` picks the iOS simulator.

3. For 1.x, check out the `bench/v1-baseline` branch, which adds the same scenes written against the 1.x API to the 1.11 example app. Its sources match the npm package; copy the prebuilt `ios/libs` and `android/libs` from `npm pack react-native-filament@1.11.0` into `packages/react-native-filament`, run `pod install`, build it the same way and run with `--version v1`.

4. Write `RESULTS.md`:

   ```sh
   bun benchmarks/report.ts
   ```
