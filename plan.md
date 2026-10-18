# react-native-filament 2.0: migration to Nitro Modules

Status: revision 6 · 2026-10-18 · revision 5 was accepted by fable and codex (see `feedback.md`); revision 6 applies the user's layout and workflow decisions (D15, D16) and fixes the §12 erratum · repo `riteshshukla04/react-native-filament-private`, stacked branches `nitro/*`

This plan moves react-native-filament from its hand-written JSI layer and react-native-worklets-core to Nitro Modules and react-native-worklets. It uses Google's prebuilt Filament binaries, puts the imperative API first, integrates natively with Reanimated and Gesture Handler (Skia and WebGPU follow as a gated phase), and treats performance as the primary constraint. Every claim about the current code points at a file and line. Every version and upstream claim was checked on 2026-10-17 or 2026-10-18; claims that still need a device or build to confirm are marked as spike work, not facts.

## Contents

1. [Requirements and how the plan meets them](#1-requirements-and-how-the-plan-meets-them)
2. [Where v1 stands](#2-where-v1-stands)
3. [Target stack](#3-target-stack)
4. [Architecture decisions](#4-architecture-decisions)
5. [Imperative API (Nitro)](#5-imperative-api-nitro)
6. [Declarative API (React)](#6-declarative-api-react)
7. [Reanimated, Gesture Handler, Skia, WebGPU](#7-reanimated-gesture-handler-skia-webgpu)
8. [Performance and zero-copy design](#8-performance-and-zero-copy-design)
9. [Workarounds removed](#9-workarounds-removed)
10. [Roadmap](#10-roadmap)
11. [Testing plan](#11-testing-plan)
12. [Engineering rules](#12-engineering-rules)
13. [Risks](#13-risks)
14. [Decisions needed](#14-decisions-needed)
15. [Decision log](#15-decision-log)
- [Appendix A: Prebuilt Filament download](#appendix-a-prebuilt-filament-download)
- [Appendix B: v1 defects the rewrite must close](#appendix-b-v1-defects-the-rewrite-must-close)
- [Appendix C: Breaking changes and migration guide outline](#appendix-c-breaking-changes-and-migration-guide-outline)
- [Appendix D: Evidence (versioned links)](#appendix-d-evidence-versioned-links)

---

## 1. Requirements and how the plan meets them

| # | Requirement | How it is met | Section |
|---|---|---|---|
| 1 | Prefab instead of building Filament. Amended by the user on 2026-10-17 to option 2: download the official archives at build time and link them directly, no Prefab, no Maven (D1). | Google's Filament 1.78.0 release archives are downloaded on first build (a Gradle task on Android, `pod install` on iOS), verified against pinned SHA-256 checksums, stored once per machine in a content-addressed cache, and linked directly. Nothing is compiled or republished, and no binaries ship in npm. The Filament submodule, the build scripts and all three Filament patches are deleted. | 4.1, 15, App. A |
| 2 | Imperative APIs first, then declarative | A vertical slice proves the imperative core first (Phase 2). Phase 3 completes the Nitro API and ports every example imperatively. Phase 4 builds the React layer on top. | 5, 6, 10 |
| 3 | Native Reanimated, gestures, Skia, WebGPU (first two most important) | SharedValues reach native through UI-runtime listeners writing binding slots. Gestures call thread-safe controllers through a bounded command queue. Both are in the Phase 2 slice. Skia and WebGPU interop is a gated phase with a version-pinned compatibility table. | 7, 10 |
| 4 | react-native-worklets instead of react-native-worklets-core | A react-native-worklets worker runtime, created lazily, is bound to Filament's render thread through the public `customQueue` option. Every entry into it goes through worklets' own guarded C++ entry points. All worklets-core code, patches and peer dependencies are removed. | 4.3 |
| 5 | Performance is strictly the top priority | Native render loop, demand-driven scheduling, native animation playback, camera control and physics stepping, no JS per frame for static or native-only scenes, SurfaceView by default, async uploads. Scoped budgets are measured against a v1 baseline with noise-aware A/B gates. | 8, 11.5 |
| 6 | Zero copy wherever possible | Asset IO is memory-mapped or streamed straight into Filament. Owning `ArrayBuffer`s, a recorder that renders into encoder buffers, and GPU interop through shared native buffers. | 8 |
| 7 | No workarounds (setTimeout, while true, polling) | Each v1 workaround is listed with its replacement, including the private Filament header v1 copies. The banned patterns are a review rule and a CI grep. | 9, 12 |
| 8 | No unwanted comments | Code standard with an explicit allow-list for comments. | 12 |
| 9 | Testing on a physical Android phone and the iOS simulator | react-native-harness, Maestro, golden images (Filament pixels and composited screen captures) and performance runs on two targets: a physical Android phone plugged in over USB, and the iOS simulator. | 11 |
| 10 | Every current example strictly tested | All 17 examples plus the hidden Test screen each have a defined protocol. It runs on both test targets and gates the release. | 11.4 |
| 11 | Nitro built-ins only | The whole v1 JSI layer is deleted and no custom `JSIConverter` or `CustomType` is written. Memory is reported through Nitro's `getExternalMemorySize()` (C++) and `memorySize` (Swift, Kotlin). Lifetime, Promises, dispatching, buffers, callbacks and errors use Nitro's built-in mechanisms. | 4.7, 5.2, 12 |

**Non-goals for 2.0**
- Old Architecture (Paper). Nitro Views require Fabric.
- React Native outside 0.83.x until another lane is tested (section 3).
- Filament's WebGPU backend. The official binaries are built with it disabled.
- New engine features beyond v1 parity, except what the integrations in section 7 need and what removing workarounds requires.
- Extracting physics into its own package, and moving to the newest React Native lane. These are follow-ups after parity (10, Follow-ups), so the migration's measurements compare like with like.

---

## 2. Where v1 stands

These facts drive the decisions below. Defect details with file references are in [Appendix B](#appendix-b-v1-defects-the-rewrite-must-close).

**Bridge**
- A hand-written JSI HostObject layer (`package/cpp/jsi/`) is installed by a TurboModule `install()` that sets `global.FilamentProxy`.
- Every property access takes a mutex, does a UTF-8 conversion and a hash lookup.
- Argument counts are never checked, which is an out-of-bounds read (`package/cpp/jsi/RNFHybridObject.h:83-94`). HostObject type checks only run in DEBUG.
- Every Promise spawns a detached `std::thread` (`package/cpp/jsi/RNFJSIConverter.h:148-198`).

**Threading**
- One render thread per process: iOS `NSThread` "filament.render.queue", Android `HandlerThread` "FilamentRenderer". It hosts a worklets-core `JsiWorkletContext` (`package/cpp/RNFFilamentProxy.cpp:46-64`).
- Native methods never marshal threads, so correctness depends on JS calling them inside worklets.
- About 20 call sites call Filament from the JS thread anyway and race with rendering. Examples: `package/src/react/FilamentScene.tsx:53-60`, `package/src/react/Configurator.tsx:54-90`, `package/src/hooks/internal/useApplyTransformations.tsx:32-77`.

**Render loop**
- It is driven from JS. A worklet listener on the Choreographer calls the user callback, then `beginFrame`/`render`/`endFrame`, every vsync (`package/src/react/FilamentView.tsx:76-140`).
- So JS runs every frame even for a static scene, and every frame allocates a new `FrameInfo` map and JS object.

**View**
- A codegen Fabric component, plus `findNodeHandle`, plus `FilamentProxy.findFilamentView(tag)`, which uses `findComponentViewWithTag_DO_NOT_USE_DEPRECATED`.
- Android uses a TextureView only.
- Surface destruction is handled asynchronously on JS, after the OS has already released the surface (`package/android/src/main/java/com/margelo/filament/FilamentView.java:114-119`).

**Build**
- Filament is built from source: a submodule pinned to a 2026-01-07 main-branch commit (about 1.68.x) plus three local patches. bullet3 is built with ndk-build.
- The build copies Filament's private `VirtualMachineEnv.h` into the shipped headers (`package/scripts/build-filament.sh`).
- The `.a` files and xcframeworks ship inside the npm tarball: `react-native-filament@1.11.0` is 343 MB unpacked across 2,556 files.

**Reanimated and gestures**
- Reanimated reaches the library only through a one-way async bridge, `useSyncSharedValue` (UI runtime → worklets-core → render thread). It is not frame-aligned, and no component accepts a Reanimated `SharedValue`.
- The library has no Gesture Handler integration. The CameraPan example drives the camera manipulator from RNGH callbacks with no synchronization, which is a data race.

**Tests:** a DEV-only `runTests()` smoke test with no assertions. No E2E tests and no device tests in CI.

**Docs:** there are no architecture or threading docs. Several guides no longer match the code.

---

## 3. Target stack

The migration keeps the React Native 0.83 line the CLI example already uses, so v1 and v2 are measured on the same stack. There is one exact planned validation lane per example app. Nothing in this combination has run yet; a lane counts as tested only after its Phase 0–2 runs pass. The library's peer ranges are bounded to what those lanes will test. Every version claim links to versioned evidence in Appendix D.

**Planned validation lanes (exact versions)**

| Package | CLI example (`examples/AppExampleFabric`) | Expo example (`examples/ExpoExample`) |
|---|---|---|
| react-native | 0.83.10 | 0.83.10 (Expo SDK 55.0.31) |
| react | 19.2.0 | as pinned by SDK 55 |
| react-native-nitro-modules / nitrogen | 0.37.1 | 0.37.1 |
| react-native-worklets | 0.7.4 (patch bump from today's 0.7.1, to match Expo and the WebGPU peer) | 0.7.4 |
| react-native-reanimated | 4.2.1 | 4.2.1 |
| react-native-gesture-handler | 2.30.0 | ~2.30.0 |
| @shopify/react-native-skia | 2.14.0 (interop examples only) | not used |
| react-native-webgpu | 0.16.1 (interop examples only) | not used |
| react-native-harness | 1.6.0 | 1.6.0 |
| Filament | 1.78.0 | 1.78.0 |

**Library peer ranges (bounded)**

| Peer | Range | Validation lane | Why |
|---|---|---|---|
| react-native | `>=0.83.0 <0.84.0` | 0.83.10 | New Architecture only. Nitro HybridViews need ≥ 0.78; iOS `onDropView()` needs ≥ 0.82. 0.82 and 0.84 are candidate bounds, not declared until a lane tests them. |
| react-native-nitro-modules | `>=0.37.1 <0.38.0` | 0.37.1 | Generated code comes from nitrogen 0.37.1. |
| react-native-worklets | `>=0.7.4 <0.8.0` | 0.7.4 | The C++ API used (`AsyncQueue`, `WorkletRuntime::runSync`/`schedule`, `extractWorkletRuntime`) is verified at 0.7.4. 0.5.1, today's Expo SDK 54 lane, lacks `customQueue` and `registerCustomSerializable`. |
| react-native-reanimated (optional) | `>=4.2.1 <4.3.0` | 4.2.1 | Only `scheduleOnUI` and `SharedValue.addListener` on the UI runtime are used. |
| react-native-gesture-handler (optional) | `>=2.30.0 <3.0.0` | 2.30.0 | The helpers use the builder API (`Gesture.Pan()` …). |

Skia and WebGPU are not peers of the library. Interop takes native buffer handles, and the packages appear only in the CLI example's interop screens.

**Toolchain:** Xcode 26.x; NDK per spike A. Nitro needs Xcode ≥ 16.4 and NDK ≥ 27.

**Follow-up lane, after parity:** RN 0.88, worklets 0.13 (where `queue` replaces the deprecated `customQueue`/`useDefaultQueue`), Reanimated 4.7, RNGH 3.4 hooks, Expo SDK 58. It is measured separately so the migration's numbers stay attributable.

---

## 4. Architecture decisions

Each decision becomes an ADR file in `docs/adr/` during Phase 0, together with the spike measurements behind it.

### 4.1 ADR-1: Prebuilt Filament, no Filament compilation anywhere

**Decision provenance**
- The original requirement was "We use prefab instead of building", pointing at [filament#7607 comment 6196418154](https://github.com/google/filament/issues/7607#issuecomment-6196418154).
- That comment (romainguy, 2026-10-15) only announces that `filament-*-android-native.tgz` ships with every release. The v1.78.0 release assets contain that archive, the iOS/macOS archives and the Java AARs; there is no Prefab metadata and no Maven coordinate for native consumption (checked through the GitHub API).
- On 2026-10-17 the user chose option 2: download the official archive at build time, verify it, link it directly, no Prefab, no Maven (D1) The user confirmed this choice to codex on 2026-10-18 (codex FEEDBACK 4).

**Pin**
- `package/filament.json` pins the version and the SHA-256 of each release asset.
- A version bump is a one-line change plus new checksums.

**Android: a Gradle task fetches the official archive, CMake links it directly**
- Input: `filament-v1.78.0-android-native.tgz` (89 MB). Google builds it with NDK 29.0.14206865, Vulkan on and WebGPU off. It contains static libraries for armeabi-v7a, arm64-v8a, x86 and x86_64, plus public headers.
- A `prepareFilament` task in `package/android/filament.gradle` stores it in an immutable, content-addressed cache under the Gradle user home, publishing each step with an atomic rename so concurrent builds and interrupted runs cannot leave a half-written entry. Details in Appendix A.
- CMake receives the extracted directory as `-DFILAMENT_DIST_DIR` and links each library as an `IMPORTED` static library. Filament's own native sample consumes the same archive this way (`android/samples/sample-cpp-viewer/CMakeLists.txt` at v1.78.0). The library list and link order live in `package/android/cmake/FilamentLibraries.cmake`.
- No `.a` file ships through npm.

**iOS: `pod install` fetches the official archive**
- CocoaPods trunk stops at Filament 1.72.0, so the official pod cannot be used for 1.78.0.
- The podspec calls `package/ios/filament.rb` while CocoaPods evaluates it. The helper uses the same content-addressed cache (under `~/Library/Caches`) and publishes an immutable `ios/Filament/<sha256>/` folder inside the package, which the podspec vendors.
- Why evaluation time: React Native installs libraries as `:path` pods, which cannot use CocoaPods' own `:http` source download without every app adding a Podfile line. React Native core uses the same mechanism for Hermes: `sdks/hermes-engine/hermes-utils.rb` (v0.83.1, lines 239-249) runs `curl` during podspec evaluation, with an `ENTERPRISE_REPOSITORY` mirror override.
- With a warm cache, evaluation performs no network access and no writes.
- Upstream `build.sh` (v1.78.0, lines 814-900) produces the xcframeworks with device arm64 plus simulator arm64/x86_64 slices.
- A non-recursive header search path removes the `gltfio/math.h` → `gltfio-math.h` rename hack from `package/scripts/build-filament.sh`.

**Overrides (both platforms):** a local archive path or a mirror base URL replaces the download. The checksum is verified either way, and a caller-supplied archive is never modified or deleted.

**The three Filament patches are deleted**

| Patch | Why it is no longer needed |
|---|---|
| `package/filament_ios_simulator.patch` | Upstream `build.sh` (v1.78.0, lines 814-900) builds arm64-simulator slices and xcframeworks. |
| `package/filament_depth_clip_mode.patch` | Upstream `MetalDriver.mm` disables depth clamp on the simulator (`#if !TARGET_OS_SIMULATOR`). Every device that runs iOS 15.1 is Apple GPU family 3 or newer, where clamp is supported. |
| `package/filament_animator_feat.patch` (`updateBoneMatricesForInstance`) | Replaced by public APIs: `FilamentInstance::attachSkin(skinIndex, target)` for clothing exported on the same rig. For mismatched joint order, a name-mapped retarget computes bone matrices from `getJointsAt()`, `getInverseBindMatricesAt()` and world transforms (after committing any local-transform transaction), then calls `RenderableManager::setBones()`. |

**No private Filament headers**
- v1 copies the private `filament/backend/include/private/backend/VirtualMachineEnv.h` and calls `VirtualMachineEnv::JNI_OnLoad` (`package/android/src/main/cpp/RNFFilament.cpp:12-24`).
- Filament 1.78.0 has no public replacement. Its install rules only ship `include/backend` (`filament/backend/CMakeLists.txt:591`), and its own native sample reaches into the source tree for the private header (`android/samples/sample-cpp-viewer/src/main/cpp/SampleAppJni.cpp:22, 54-66`).
- v2 does not include the header and does not call that function. Filament's GL platform only uses the JavaVM when one was registered (`PlatformEGLAndroid.cpp:230`, `hasVirtualMachine()`); the other users are `ExternalStreamManagerAndroid` (SurfaceTexture streams, not used) and the Java bindings (not linked).
- What may be lost: without a registered JavaVM, the GL driver thread is not attached to the JVM before `PerformanceHintManager::init()` (ADPF performance hints). Spike A checks whether the hint session still starts and, if not, measures the frame-time effect with an experimental local build.
- If the effect is material, the missing public hook becomes an upstream request and an explicit release gate (recorded in section 15). It is never solved by shipping or re-declaring the private header.

**Tools**
- `matc` and `cmgen` come from `filament-v1.78.0-mac.tgz`, fetched the same way by `scripts/filament/tools.ts`.
- They recompile the `.mat` sources (`examples/Shared/assets/*.mat`) and regenerate the default IBL KTX if needed.
- Material packages must match the engine's material version. CI recompiles them and fails on drift.

**Contributors:** nothing to set up. The first Gradle build or `pod install` fetches and verifies the binaries. This replaces `build-filament.sh` (hours of compilation) and `setup-filament-quick.sh`.

**Consequences**
- The npm package contains no binaries, only sources and generated code, down from 343 MB. Phase 1 measures it.
- The first build of each Filament version needs access to github.com, or an override. CI caches both stores, keyed on `filament.json`.
- Filament upgrades become a version bump, a checksum update and a material recompile.

**Open risk:** libc++/NDK compatibility of Google's NDK 29 static libraries with React Native's NDK 27.1 toolchain. Spike A settles it (section 13). Evidence so far: v1 CI already builds Filament with NDK 29 (`.github/workflows/build-android.yml`) and links it into apps built with NDK 27.1.

### 4.2 ADR-2: Repository and packages

**Bun monorepo, hoisted at the root (D15)**
- One `bun install` at the root. The linker is `hoisted`, and every workspace uses versions compatible with the others, so `node_modules` exists only at the root.
- `packages/react-native-filament`: the library, created with `nitrogen init` and filled in by the migration.
- `apps/example`: the React Native CLI example (the lane in section 3). `apps/expo-example`: the Expo example. `apps/shared`: the example screens and assets both apps use.
- `docs/`: the documentation site.
- File references to `package/…` describe v1 code. New files named under `package/` in this plan live under `packages/react-native-filament/`.
- Physics (bullet3) stays in the core package and is ported to Nitro there. Bullet is compiled from a vendored, pruned source set (zlib license) by the package's CMake and podspec, replacing the `bullet3` submodule and `build-bullet3.sh`. Upstream ships no prebuilt bullet binaries.

**Naming:** npm package `react-native-filament`; Nitro module `NitroFilament` (podspec, `ios.iosModuleName`, `android.androidCxxLibName`); C++ namespace `margelo::nitro::filament`; Kotlin package `com.margelo.nitro.filament`.

**Removed**
- `filament` and `bullet3` submodules.
- `package/scripts/build-filament.sh`, `setup-filament-quick.sh`, `build-bullet3.sh`.
- The three Filament patches and `patches/react-native-worklets-core+1.6.2.patch`.
- The copied private header `VirtualMachineEnv.h`.
- `codegenConfig`, the TurboModule installer, the Paper code (`package/android/src/oldarch`, `RNFFilamentViewManager.mm`).
- The whole custom JSI layer: `package/cpp/jsi/`, `package/cpp/threading/`, `RNFListener*`, `RNFManagedBuffer.h`, `RNFFilamentBuffer.h`, the platform dispatchers and managed buffers (replaced by Nitro built-ins, 5.2).
- `package/cpp/test` (replaced by harness tests).
- Each item is removed only when its replacement's tests pass.

**Workflow (D16)**
- Atomic PRs stacked with the `gh stack` extension, branches `nitro/NN-topic`, each based on the one below it. Squash-merge bottom up.
- Every PR that changes runtime behaviour carries screenshots from the iOS simulator and the plugged-in Android phone.
- Cut a `v1` maintenance branch from current `main`.

### 4.3 ADR-3: Threading model

**Decision:** each Engine owns exactly one render thread. Every call into Filament happens on it. When render-thread JS is needed, a react-native-worklets runtime is bound to that same thread, so it runs without any thread hop.

```
 JS thread (RN runtime)          UI thread (UI worklet runtime)            Filament render thread                        Filament-internal
 ──────────────────────          ──────────────────────────────            ──────────────────────                        ─────────────────
 React components and hooks      RNGH gesture worklets                     wakes on jobs, or on vsync while there is     driver thread
 async loaders (Promise) ─────┐  SharedValue listeners ─► binding slots ─┐  frame demand (4.4)                            (Metal/GL/Vulkan)
 runOnRenderThread(worklet) ──┼──────────────────────────────────────────┼► 1. queued jobs (FIFO), teardown first       JobSystem workers
                              │  manipulator.grab*() ─► command queue  ──┘  2. binding slots and command queues
                              │                                             3. incremental uploads
                              └───────────────────────────────────────────► 4. user frame listeners (render runtime)
                                                                            5. animation players, physics, cameras
                                                                            6. render each active ViewTarget
```

**The render thread**
- iOS keeps v1's mechanism: a dedicated thread running its own run loop, with a `CADisplayLink` on that run loop (`package/ios/src/RNFNSThreadDispatcher.mm`, `RNFDisplayLinkListener.m`). Jobs are posted with `CFRunLoopPerformBlock` plus `CFRunLoopWakeUp`; `preferredFrameRateRange` enables ProMotion.
- Android replaces v1's Java `HandlerThread` + `Choreographer` + fbjni dispatcher with their NDK equivalents: a thread that calls `ALooper_prepare`, jobs delivered through an `eventfd` registered with `ALooper_addFd`, and vsync from `AChoreographer_postFrameCallback64` (API 29+) or `AChoreographer_postFrameCallback` (API 24–28).
- Why Android changes: the dispatcher has to be rewritten anyway (`RNFJDispatcher.cpp:29-51` runs jobs under its mutex and has a broken `runSync`), the C++ worklets queue and the Nitro Dispatcher both post from C++, and the NDK loop removes five Java/JNI files and every per-job and per-frame JNI crossing. It is the same OS mechanism, not a workaround. The Phase 2 slice measures it; Java `Choreographer` stays a valid fallback if the slice shows a problem.

**Worklets binding** (every API below is verified at react-native-worklets 0.7.4; links in Appendix D)
- The runtime is created lazily, the first time `runOnRenderThread` or a render callback needs it, and never for engines that run native-only scenes.
- `RenderThreadQueue` implements `worklets::AsyncQueue`; `push` enqueues onto the render thread.
- Creation happens on the RN thread: `createWorkletRuntime({ name, useDefaultQueue: false, customQueue })`. Worklets runs its own setup worklet synchronously on that calling thread; RNF passes no initializer of its own.
- The RN thread then passes the new runtime object to `renderThread.bindRuntime(runtime)`, a raw method. It calls the public `worklets::extractWorkletRuntime`, keeps the `WorkletRuntime`, and installs a Nitro `Dispatcher` through `WorkletRuntime::runSync`. No other thread can touch the runtime at that point.
- The JS runtime object is never handed to users, and RNF's JS code does not keep it. Only RNF and worklets' own event loop can queue work on the render runtime.

**Worklets' event loop stays on.** In 0.7.4 the public `WorkletRuntimeConfig` type only accepts `enableEventLoop: true`, so RNF keeps the default.
- Worklets then installs `setTimeout`, `setImmediate` (a zero-delay `setTimeout`), `setInterval`, `requestAnimationFrame` (a 16 ms timer while callbacks are queued) and a `queueMicrotask` queue on the render runtime.
- Their timers live on one worklets thread per runtime. It waits on a condition variable while no timer is pending, so an idle runtime costs a sleeping thread and nothing else. Due timers are pushed onto RNF's queue as ordinary jobs.
- RNF's own code never calls these functions (requirement 7). Render-thread user code should use frame listeners for per-frame work.

**Entries into the render runtime.** All of them run on the render thread, through worklets' public C++ entry points, which take the runtime's mutex.
- RNF enters the runtime only through the runtime-lambda overload `runSync([&](jsi::Runtime& rt) { … })`, which holds the runtime mutex for the whole sequence: converting a worklet, calling it, and any microtask checkpoint (`WorkletRuntime.h`, Appendix D). RNF never uses the `jsi::Function` or `SerializableWorklet` overloads, which do not hold the mutex across that sequence, nor `schedule(std::function<void()>)`.
- Frame listeners run inline at stage 4 of the frame, inside one such `runSync` call. They finish before native systems and rendering start (4.4). They are never posted to the queue, so nothing else can run between them and the rest of the frame.
- `runOnRenderThread` jobs, Promise settlement and async Nitro callbacks destined for the render runtime run as RNF jobs in FIFO order. Each job enters the runtime through the same runtime-lambda `runSync`.
- The Dispatcher's `runAsync` schedules such a job. Its `runSync` runs inline only when already on the render thread and throws otherwise, so there is no cross-thread wait. VisionCamera's `NativeThreadDispatcher` makes the same choice.
- Reentrancy: the runtime mutex is recursive. A listener that calls RNF methods re-enters on the same thread without deadlock. A listener cannot start a nested frame: `requestFrame()` only records demand.
- `enableLocking` is not touched; worklets' runtime mutex stays on.
- HybridObjects cross runtimes through Nitro's registered custom serializable (box on pack, unbox on unpack).

**Promise continuations on the render runtime**
- Worklets 0.7.4 creates the runtime with `facebook::hermes::makeHermesRuntime()` and the default configuration (`WorkletRuntime.cpp`, Appendix D). React Native's own runtime enables Hermes' microtask queue explicitly; this one does not. Its `runSync` and `schedule` do not drain microtasks.
- The public contract is therefore: continuations always run on the render thread, in order, after the entry that created them returns, and never inside that frame's stages 5–6. Frame-critical work stays synchronous.
- Spike D records the route on the pinned Hermes. Both candidates are public and make progress on an idle engine:
  - worklets' `setImmediate` (part of its documented event loop), if the Hermes Promise implementation itself schedules continuations through it: the continuation arrives as a queued job, and every queued job wakes the render thread (4.4). RNF itself never calls `setImmediate` or `setTimeout` to repair completion or ordering;
  - Hermes' own job queue: RNF calls the public JSI `drainMicrotasks()` at the end of each entry, inside the same `runSync` call and so under worklets' lock.
- The gate: a Promise created by a listener and one created by a `runOnRenderThread` job must both settle on an otherwise idle engine. If neither route does that on 0.7.4, spike D fails and the lane changes to a worklets version with a supported checkpoint. RNF never reads worklets' private globals, polls a flag or waits for a Promise.
- Worklets' `queueMicrotask` queue is drained only by worklets' own jobs. RNF does not call worklets' internal flush, so render-thread code uses Promises instead.
- Reload: the RN runtime's teardown destroys the `FilamentFactory` root object, which starts shutdown of every engine it created (4.7).

**Thread contract.** Every method is documented with a `@thread` JSDoc tag.

| Class | Examples | Callable from | Mechanism |
|---|---|---|---|
| Render-thread | `scene.addEntity`, `transformManager.setTransform`, `animator.applyAnimation`, `engine.createScene` | Render runtime only | Direct Filament call. Calling from another thread throws `FilamentThreadError` in every build (a thread-local compare). |
| Async | `engine.loadModel`, `engine.loadTexture`, `engine.createViewTarget`, `viewTarget.pick`, `viewTarget.takeSnapshot`, recorder start/stop; `engine.shutdown` (RN or UI runtime only, 4.7) | Any runtime | One transition per ownership boundary; the Promise settles on the caller's runtime. |
| Controller | `CameraManipulator.grab*`, `AnimationPlayer.play`, binding `set*`, `engine.requestFrame`, `FrameListenerSubscription.remove` | Any thread | Bounded command queue or binding slot, drained at frame start (7.1, 7.2). |
| Immutable | `model.boundingBox`, `model.getInstance(i)`, `modelInstance.animator`, `animator.animations`, `model.getEntities()` | Any thread | Read-only state captured at load. |

**Render-thread JS rules**
- Render-thread JS must be short, and must not make synchronous cross-runtime calls. In the pinned lane those are `runOnUISync`, `executeOnUIRuntimeSync`, and reads or writes of a Reanimated `sv.value`, which Reanimated 4.2.1 performs through `runOnUISync`.
- Those calls wait for another runtime's lock. That would make frame time depend on other threads and could close a wait cycle with surface teardown (4.5).
- SharedValues reach the render thread through bindings instead (7.1).
- What RNF can enforce:
  - its own APIs never block across runtimes and never wait on the main thread;
  - render-thread reads of SharedValues are offered only through non-blocking bindings;
  - debug builds time every listener and report any that exceed a configurable budget (default 4 ms) through `engine.addOnErrorListener`.
- What RNF cannot enforce: user code calling worklets' synchronous APIs directly. That rule is a documented usage contract.

**Running JS-thread work on the render thread**
- `runOnRenderThread(engine, worklet): Promise<T>` is a small JS helper, called from the RN runtime where React effects run. Worklets 0.7.4 has no Promise-returning call for worker runtimes; it exports `scheduleOnRuntime`, which returns nothing.
- The helper creates the Promise in the caller's runtime and serializes a wrapper worklet with worklets' public `createSerializable`. The wrapper runs `worklet` and settles with `scheduleOnRN(resolve, result)`, or with `scheduleOnRN(reject, error)` if it throws.
- It passes the wrapper and `reject` to `renderThread.runAsync(wrapper, onCancelled)`, a raw method. The method extracts the wrapper with worklets' public `extractSerializableOrThrow`, converts `onCancelled` with Nitro's own function converter, and queues an RNF job that converts and runs the wrapper inside one runtime-lambda `runSync`.
- Why not `scheduleOnRuntime`: its job is opaque to RNF. A job dropped at shutdown would leave the caller's Promise pending forever. RNF's job can be cancelled instead.
- Exactly-once settlement:
  - a job that runs settles through its wrapper;
  - a job that has not started when the engine leaves `live` is cancelled instead of run, as is a job pushed after the queue has closed (checked under the queue's lock);
  - cancelling calls `onCancelled` with `FilamentDisposedError`, which Nitro delivers on the caller's runtime.
- Jobs run in FIFO order, so React effect and cleanup order is preserved without timers.

**Rejected alternatives**
- **Rendering on the UI thread.** With multiple views or heavy scenes it would block scrolling and UI work. Native code would have to take the worklets UI-runtime lock. Offscreen recording cannot run there.
- **A mutex-guarded Engine callable from every thread.** Filament documents the Engine as not thread-safe (`Engine.h`, "Thread safety"), so every call would take the lock and the render loop would contend with JS work. Multi-call sequences would still race.
- **Implicitly buffering sync setters from the JS thread.** It hides a one-frame latency, makes reads inconsistent with earlier writes, and duplicates state.

### 4.4 ADR-4: Native render loop and scheduling

**The render thread sleeps in its run loop until a job or a vsync callback arrives. It never spins.**

**What runs in one iteration** (on the render thread, in this order)
1. Queued jobs, FIFO. Surface-teardown jobs go to the front (4.5).
2. Binding slots and controller command queues (7.1, 7.2).
3. Incremental uploads: `ResourceLoader::asyncUpdateLoad()`, only while a load is pending. This is Filament's documented incremental-upload contract (`gltfio/ResourceLoader.h`), not a timer or a poll.
4. User frame listeners, run inline through `WorkletRuntime::runSync` (4.3 describes when their Promise continuations run). Stages 5 and 6 start only after they return. Skipped entirely when there are none.
   - The listener list is snapshotted when the stage starts. A listener removed during the stage is not called in later frames.
   - If the engine is disposed during the stage, the remaining listeners and stages 5–6 are skipped, and the destruction job runs next.
5. Native systems: animation players and bone matrices, physics auto-step and transform sync, manipulators driving cameras.
6. Each active ViewTarget: `beginFrame`, `render`, `endFrame`. If `beginFrame` returns false the frame is skipped, never queued.
7. Completions arrive through RNF's Filament `CallbackHandler`. Filament calls its `post()` from its service thread, never from the render thread (`backend/CallbackHandler.h`, `backend/src/Driver.cpp`). `post()` turns each callback into a job on this thread (4.7 covers shutdown):
   - picks (`View::pick`) and snapshots (`Renderer::readPixels`), on every backend;
   - per-frame swapchain callbacks. `SwapChain::setFrameCompletedCallback` (GPU completion) is Metal-only in Filament 1.78.0 and is never called on OpenGL or Vulkan. `SwapChain::setFrameScheduledCallback` (CPU-side processing complete) works on every backend (`filament/SwapChain.h`, Appendix D).

**Frame demand decides whether vsync is armed**
- Jobs wake the thread whether or not any surface exists, so loads and disposals progress before a view mounts.
- The vsync callback is re-armed only while there is frame demand:
  - an active target in `continuous` mode;
  - a registered frame listener, in either render mode, for as long as it stays registered;
  - an `on-demand` target marked dirty by a binding, controller command, load completion, resize or `requestFrame()`;
  - a pending incremental upload, until Filament reports completion;
  - a playing `AnimationPlayer`, running physics auto-step or moving manipulator, each of which marks its targets dirty every frame while active.
- With no demand, the callback is not re-armed and the thread sleeps. CADisplayLink and AChoreographer follow the display, not our surface, so uploads still complete before the first view mounts.

**Waking an idle render thread**
- Demand changes that come from other threads post a wake job, because a sleeping thread with no vsync armed would otherwise never notice them. These are: publishing a binding value, appending a controller command, `requestFrame()`, changing `renderMode`, adding or removing a frame listener.
- Wakeups are coalesced with one atomic flag per engine:
  - the producer publishes its data first, then posts a wake job only if `wakePending.exchange(true)` returned `false`;
  - the wake job first stores `false`, then drains bindings and command queues and recomputes demand, arming vsync if needed.
- A producer that publishes after the flag is cleared sets it again and posts another wake job, so no wakeup is lost. No thread spins or retries.

**Render modes**
- `continuous` (default, v1 parity).
- `on-demand`: renders only dirty targets, from the sources listed above.

**Offscreen recording is not vsync-driven.** Each platform has a bounded, callback-driven pump. At most `N` render submissions are outstanding (default 2). Spike G confirms each trigger, and choosing the final pump is its exit decision.
- iOS (Metal):
  - Initial trigger: `startRecording()` after `AVAssetWriter.startWriting()`.
  - Successor triggers:
    - the frame's `setFrameCompletedCallback` (GPU completion, supported on Metal) appends that frame's pool `CVPixelBuffer`, then admits the next frame if fewer than `N` are outstanding;
    - a key-value observation of `isReadyForMoreMediaData` becoming `YES`. The iOS SDK header `AVAssetWriterInput.h` documents that property as "key value observable".
  - Pool exhaustion: if the pixel-buffer pool has no free buffer, no frame is admitted until an append returns one.
  - A frame that completes while the input is not ready is held, still counting toward `N`, and appended on the next readiness change.
  - Stop: stop admitting, let outstanding frames complete and append, then `markAsFinished()` and `finishWriting`.
  - Errors: the writer's `.failed` status rejects the pending `startRecording()`/`stopRecording()` Promise and stops the pump. Disposal cancels writing.
- Android (OpenGL or Vulkan):
  - The `MediaCodec` encoder runs in asynchronous mode (`setCallback`); its input `Surface` is the SwapChain.
  - Initial trigger: `startRecording()` after `MediaCodec.start()`.
  - Successor trigger: the frame's `setFrameScheduledCallback`, which admits the next frame if fewer than `N` are outstanding. Frame-completed callbacks are not available there.
  - Backpressure: when the encoder falls behind, the producer blocks inside Filament's driver on the Surface's BufferQueue. That delays the scheduled callbacks, which slows the pump.
  - Encoded output: `onOutputBufferAvailable` writes samples to `MediaMuxer` and releases each buffer; `onOutputFormatChanged` adds the track and starts the muxer.
  - Stop: stop admitting. After the last frame's scheduled callback, call `Engine::flushAndWait()` once on the recording engine's own thread, so the last frame has reached the encoder Surface. Then `signalEndOfInputStream()`, wait for the output flagged `BUFFER_FLAG_END_OF_STREAM`, stop the muxer and settle the Promise. Spike G checks whether the scheduled callback already implies that the frame was presented; if it does, that flush is dropped.
  - Errors: `onError` rejects and stops the pump. Disposal releases the codec and the muxer.
- Both platforms:
  - Offline export uses its own Engine, so backpressure never stalls on-screen rendering; v1's recording example already uses its own scene.
  - Presentation timestamps are `frameIndex / fps`, set with `Renderer::setPresentationTime` on Android and as the sample time on iOS, independent of display vsync.

**`FrameInfo`**
- Fields: `{ timestampNs, deltaSeconds, elapsedSeconds, frameIndex }`.
- `deltaSeconds` is 0 on the first frame and after resume. That fixes the first-frame spike the PhysicsCoin example works around.

**Frame rate:** per target, `targetFrameRate` maps to `preferredFrameRateRange` on iOS and to Filament's `SwapChain::setFrameRate` on Android (Filament 1.78.0), plus Filament `FrameRateOptions`.

### 4.5 ADR-5: Views and surfaces

**`FilamentView` is a Nitro HybridView** (Nitro requires views in Swift and Kotlin)
- iOS (Swift): a `UIView` whose layer class is `CAMetalLayer`.
- Android (Kotlin): a `FrameLayout` hosting a `SurfaceView` when opaque, the default, or a `TextureView` when `transparent` is set.
- It replaces the codegen component, `onViewReady`, `findNodeHandle`, `findFilamentView`, the private `RCTCxxBridge` category and the `_DO_NOT_USE_DEPRECATED` lookup.
- The C++ `ViewTarget` receives the view through `engine.createViewTarget(view, options)` and calls the view's generated spec methods. Nitro supports C++ calling Swift/Kotlin-implemented specs; the reverse direction is not used.

**Surface lease: one object per OS surface, with its own lifetime**
- `NativeSurface` is an internal Swift/Kotlin spec, never exported. Each instance represents exactly one OS surface (one generation). The platform view creates a new lease whenever the OS hands it a surface and never reuses one.
- Android creates a lease only for a window it could acquire, and keeps at most one unreleased lease per view: a new observer or surface gets a lease only after the previous one is released, so a window never has two swap chains, even across Engines.
- The lease owns the native reference for its whole life:
  - Android acquires the window with `ANativeWindow_fromSurface` (which takes a reference) when the lease is created, and releases it with `ANativeWindow_release` in the lease's `release()`;
  - iOS holds the `CAMetalLayer` strongly.
- C++ reads the handle (`bigint`) once per lease, on the render thread, while it holds the lease. The handle never leaves C++.
- `ViewTarget` holds the lease while a SwapChain exists for it, and calls `release()` itself after the SwapChain is destroyed. Nothing else releases an attached lease, also not a job cancelled by `shutdown()`; the shutdown job destroys the target first.
- A released lease reports handle 0 and is never attached.
- Generations are lease identities, not pointer values, so a recycled native address cannot alias an old surface.

**State machine:** `detached → attaching(lease) → active(lease) ⇄ paused(lease) → detaching(lease) → detached`, plus a terminal `destroyed` after dispose.
- Attach and detach are jobs tagged with their lease. A detach whose lease is not the target's current lease releases it, so an attach still queued for that lease creates nothing.
- Surface events that arrive while attaching or detaching are processed in order.

**Android SurfaceView teardown (synchronous, as `SurfaceHolder.Callback.surfaceDestroyed` requires)**

Wait graph:
```
main thread, in surfaceDestroyed ──waits for──► the view's unreleased lease, released by the render thread teardown job:
                                                revoke target → destroy SwapChain → (Vulkan) empty frame → flushAndWait → lease.release()
render thread ──may wait for──► Filament driver thread (flushAndWait: until Filament has executed the commands queued before it)
render thread ──never waits for──► main thread, UI runtime, RN runtime, or any lock main can hold
```
- Before waiting, main sets the target's revoke flag. The render thread checks it before every `beginFrame`, so a revoked target is never rendered again.
- The teardown job is queued at the front and runs at the next admission point: before user listeners, after them, or between targets.
- The main thread therefore waits for the native phase or user listener in progress to finish, then for Filament to execute the commands queued before the swapchain destruction.
- Neither wait has a time bound. A long listener or a GPU or driver stall lengthens it and can cause an ANR. That residual risk is inherent in Android's contract that the surface is not touched after `surfaceDestroyed` returns.
- RNF reduces the risk but cannot remove it:
  - listeners must be short, and debug builds report long ones (4.3);
  - the TextureView path below needs no wait at all.
- RNF never times out and continues; the released surface is never touched again.
- The graph is acyclic as long as render-thread JS keeps the cross-runtime rule (4.3). RNF native code never waits on main, and RNF holds no lock while waiting.
- Spikes C and D exercise teardown while listeners are running, while jobs are queued, and while other runtimes access the render runtime.
- Filament 1.78.0's Vulkan backend frees a destroyed SwapChain, and disconnects its window, only in the garbage collection at the end of a frame; `flushAndWait` alone leaves the window connected. On Vulkan the teardown job therefore ends an empty frame on a 1×1 headless SwapChain before `flushAndWait`.
- The flush is Filament's documented minimum. Filament's own sample does exactly this in `onDetachedFromSurface`: `destroySwapChain` then `flushAndWait()`, "Required to ensure we don't return before Filament is done executing the destroySwapChain command, otherwise Android might destroy the Surface too early" (`android/samples/sample-hello-triangle/src/main/java/com/google/android/filament/hellotriangle/MainActivity.kt:336-346` at v1.78.0).

**Android TextureView teardown (asynchronous)**
- `onSurfaceTextureDestroyed` returns `false`, which leaves the `SurfaceTexture` to us.
- The teardown job releases the lease (window, `Surface`, `SurfaceTexture`) after `destroy(swapChain)` + `flushAndWait()`.
- The main thread never waits.

**iOS**
- Resize: `layoutSubviews` computes `bounds × window.screen.scale` and publishes it to the target. The viewport updates at the next frame start. No fence waits; this removes `synchronizePendingFrames` (`package/cpp/core/RNFEngineImpl.cpp:326-332`).
- Background: the display link pauses, since no GPU work is allowed in the background.
- Removing the layer from the window detaches the target through the same lease state machine.

**Recycling and unmount**
- `RecyclableView.prepareForRecycle()` detaches the target, which makes lists of views cheap.
- `onDropView()` disposes it. It fires on Android and, from RN 0.82, on iOS.

**Opaque by default, for performance:** SurfaceView on Android and an opaque `CAMetalLayer` on iOS. Transparency is opt-in. This is a breaking change: v1 defaulted to transparent.

### 4.6 ADR-6: Data representation

**Entity**
- `Entity` is a `number` (the uint32 entity id). v1 allocated a HostObject per entity per call.
- Filament's `EntityManager` is process-global (`utils/EntityManager.h`, `static EntityManager& get()`), while components belong to one Engine.
- RNF checks component presence, not provenance. Entity IDs are process-global in Filament, so an entity that legitimately has components in two engines is valid in both. RNF does not claim to know which engine created an entity.
- Every check runs on the engine's render thread, inside render-thread methods. No method callable from other threads looks up a Filament component.

**Policy per kind of operation**

| Operation | Check | Failure |
|---|---|---|
| Reads or writes a component (transform, renderable, light, camera, morph, bones) | `EntityManager::isAlive(e)` and the component exists in this engine's manager | `FilamentInvalidEntityError` naming the method and entity |
| Scene membership (`scene.addEntity`, `removeEntity`) | alive, and a renderable or light component exists in this engine | `FilamentInvalidEntityError` |
| Attaches to a caller's entity (`attachSkin(skin, target)`, `createTransformBinding(entity)`) | alive, and the component the operation needs (renderable with bone attributes, transform) exists in this engine | `FilamentInvalidEntityError` |
| Creates entities (lights, cameras, renderables, model loading) | creates its own entities; never takes a caller's entity | — |
| Takes another HybridObject (Scene, Model, Material, Texture, Camera, ViewTarget, CameraManipulator) | the object belongs to the same `EngineContext` (pointer equality) | `FilamentEngineMismatchError` |

- `createTransformBinding(entity)` is therefore a render-thread method: it validates once, on the owner thread. The binding it returns accepts `set*` calls from any thread (5.5).
- No extra registry is needed; component checks cost one or two lookups per call.

**Math**
- `Float3`, `Float4` and `Quaternion` are tuples.
- The `Mat3`/`Mat4` representation is decided by spike F: a 16-tuple versus a native-backed `ArrayBuffer`.
- Primitive-argument fast paths are added only where a benchmark shows the conversion matters.

**Options:** Nitro structs with typed fields. This fixes the TS/native drift in v1:
- TAA `upscaling` is a float factor, not a boolean, and `varianceGamma` is a float;
- TAA `filterWidth` is mapped;
- AO `power` is passed through;
- `EngineConfig` keys match.

**String unions:** kebab-case values, for example `'fxaa'`, `'front-and-back'`, `'two-passes-one-side'`, and `'focused-spot'` (v1 maps the misspelling `focused_sport`, `package/cpp/core/RNFLightEnum.h:22`).

**Lights:** one factory per light type (`createDirectionalLight`, `createSunLight`, `createPointLight`, `createSpotLight`, `createFocusedSpotLight`), instead of one config full of nullable fields.

**Bounds:** explicit conservative bounds stay a supported concept.
- `renderableManager.setAxisAlignedBoundingBox(entity, box)` maps to Filament's public API.
- `scaleBoundingBox(model, factor)` (v1 parity) enlarges a model's bounds.
- Filament's `recomputeBoundingBoxes()` is documented as only useful for malformed accessor min/max data and is unavailable after `releaseSourceData()` (`gltfio/FilamentInstance.h`, v1.78.0). It is exposed as such, not as a skinning fix.

**Bytes:** `ArrayBuffer`, owning when created natively. Large results such as snapshots are HybridObjects with lazy `toArrayBuffer()` and `saveToFile()`.

### 4.7 ADR-7: Ownership, disposal and memory

**`EngineContext`**
- A `shared_ptr` that owns the Filament `Engine`, `AssetLoader`, `ResourceLoader`, material provider, `RenderThread`, the resource registry and the destruction queue.
- Every HybridObject holds a `shared_ptr<EngineContext>` plus a `ResourceHandle` for its own native resources.

**Resource graph**
- Each native resource has one `ResourceHandle`, registered with its owner edge:
  - Engine → Scene, View, Camera, ViewTarget, Model, Material, Texture, IndirectLight, Skybox, Light, Renderable, CameraManipulator, binding;
  - Model → ModelInstance → Animator → AnimationPlayer;
  - Material → the MaterialInstances it created;
  - ViewTarget → SwapChain, Renderer, View list.
- Children hold strong references to their parents, so garbage collection never destroys a parent under a live child. Owners hold their children weakly, for cascading.
- A handle's state is `live → disposing → destroyed`. It lives in one atomic shared by every wrapper of that resource, in every runtime.
- Every method checks the state first and throws `FilamentDisposedError` unless it is `live`.
- This matters because Nitro's `dispose()` only clears the calling runtime's wrapper: in 0.37.1, `HybridObject::disposeRaw` calls the virtual `dispose()`, removes the NativeState from that one JS object and clears the object cache (`cpp/core/HybridObject.cpp:47-57`). Copies in other runtimes still reach the native object, and the handle state is what makes them fail cleanly.

**Disposal**
- `dispose()` (Nitro's built-in method, overridden) marks the handle and every owned descendant `disposing`, then enqueues one destruction job on the render thread.
- Linearization point: the successful compare-and-set of the handle state from `live` to `disposing`.
  - Every method checks the state on entry. A call whose check happened before that point completes normally. It runs on the render thread, and the destruction job runs after it on the same thread, so no native object is freed under a running call.
  - A call that checks after that point throws `FilamentDisposedError`. That includes calls made by jobs queued before the dispose; their Promises reject. Accepted work is therefore cancelled, not completed.
  - Queue admission does not need to be atomic with the state change: destruction is itself a job on the same FIFO thread.
  - Controller and immutable methods, which run on any thread, touch only memory their HybridObject owns (command queues, binding slots, data captured at load), never Filament objects. A late call after its state check passed writes into a queue that is never drained again, which is memory-safe while the destruction job runs.
- The destruction job:
  - removes the resource's entities from every scene;
  - severs non-owning references, such as a camera following a manipulator;
  - destroys descendants children-first, then the resource, in Filament's order (components before entities);
  - marks every handle `destroyed`.
- Async work is split by owner:
  - IO tasks (read, download, decode) hold only CPU memory and a cancellation token, which is the engine handle plus the handle of the object being created. They never create or hold Filament objects.
  - Filament objects are created only by render-thread jobs, which register each one in the resource graph as it is created.
  - When an IO task finishes it offers its completion job to the render queue. If the token is no longer `live`, or the queue has closed, the offer is refused under the queue's lock, the task frees its buffers through their destructors, and it stops.
  - A completion job that runs and finds a handle no longer `live` destroys what it created in that job and rejects with `FilamentDisposedError`.
- Each pending operation settles exactly once: whichever side removes it from the engine's pending-operation registry first (its completion, its cancellation or shutdown) settles it.
- After `dispose()`, that wrapper is unusable: Nitro removed its NativeState. Wrappers of the same object in other runtimes throw `FilamentDisposedError`.
- Without `dispose()`: when every wrapper in every runtime has been collected, the last native reference queues the same destruction job. Destructors never call Filament directly; they may run on any thread, including Hermes GC finalizers.
- There is no `release()` or `isValid` of our own.

**Engine shutdown**
- `engine.shutdown(): Promise<void>` is the terminal operation, and the one method exempt from the state check.
  - Called while `live`, it moves the engine to `disposing` with the same compare-and-set as `dispose()`, then queues the shutdown job.
  - Called while `disposing`, it starts nothing new. Every caller's JS Promise is backed by the same native Nitro `Promise`, which Nitro settles on each caller's runtime.
  - Called after `destroyed`, it resolves immediately. The engine becomes `destroyed` only when the thread has been joined (below).
- Who may call it: the RN runtime and the UI runtime. Calling it on the engine's own render runtime throws `FilamentThreadError`, because that runtime is destroyed during shutdown and could not receive the result.
- `engine.dispose()` also starts shutdown, but returns nothing, and that wrapper cannot call `shutdown()` afterwards. Callers that need completion call `shutdown()` instead of `dispose()`.
- The shutdown job on the render thread:
  1. closes the job queue under its lock. Jobs that have not started are settled, not run: `runOnRenderThread` jobs are cancelled (4.3), and worklets' timer jobs are dropped, since they have no caller waiting.
  2. settles every pending operation:
     - Promises destined for the render runtime are rejected there, inside a guarded entry, before that runtime is released;
     - Promises destined for the RN or UI runtime are rejected through those runtimes' Nitro dispatchers, which outlive the engine;
  3. destroys all resources in reverse dependency order;
  4. removes frame listeners and releases the `WorkletRuntime` reference;
  5. calls `Engine::destroy`. Filament stops its service thread there after it has posted every queued callback, and joins its driver and job threads (`backend/src/Driver.cpp`, `~DriverBase`);
  6. submits the join task to RNF's IO executor and returns from the thread function.
- Filament callbacks during shutdown. Filament requires the handler to outlive every pending callback and leaves draining to it (`CallbackHandler.h`).
  - Every callback body RNF gives Filament has two parts: owner work (reading results, settling a Promise, driving a recording pump) and release of the CPU payload it owns. Owner work runs only on the render thread while the engine is `live`.
  - Each `post()` leads to exactly one invocation of Filament's callback, which then frees Filament's own callback data. It happens in one of three ways:
    - a queued job that runs normally;
    - a queued job cancelled in step 1, invoked on the render thread with the engine no longer `live`, so it only releases its payload;
    - a `post()` that finds the queue closed, invoked inline on the posting thread, release only.
  - So no callback touches Filament or JS from the service thread, waits for the render thread, or is queued on a closed queue. Callback operations are settled in step 2 like every other pending operation.
  - The handler is owned by `EngineContext`, which outlives `Engine::destroy`. Filament posts nothing after `Engine::destroy` returns.
- Quiescence: after step 5 the queue is closed and Filament has no threads left, so nothing can post render-thread work. IO tasks still running only free their own memory.
- Completion is owned outside that thread. RNF's IO executor, the small C++ thread pool that already does decoding and file work and outlives every engine, runs the join task: it joins the render thread, marks the engine `destroyed`, and then resolves the shared shutdown Promise. So "resolved" means the render thread has exited, not that a job on it claimed to.
- The join cannot starve the pool. It is submitted only when the render thread has nothing left to do but return, and the render thread never waits for IO tasks, so the join waits only for that return.
- After the queue has closed, a job pushed by RNF's Dispatcher for the render runtime is dropped, because its destination runtime is being destroyed. A `runOnRenderThread` push is cancelled at the push.
- Nitro's synchronous `dispose()` never waits for any of this.

**No reference cycles**
- Native code holds JS values in only three places: frame and event listener registries, pending Promise resolvers, and the render thread's `WorkletRuntime` reference.
- All three are cleared by `remove()`, by settlement, or by shutdown. Nothing else stores JS values.
- So `JS closure → HybridObject → EngineContext → listener → JS closure` is broken deterministically, never left to the GC.

**Memory reporting through Nitro's built-in hook**
- C++ HybridObjects override `getExternalMemorySize()`; Swift and Kotlin HybridObjects override `memorySize`. No custom JSI or GC machinery is added.
- When it is read: Nitro 0.37.1 calls `setExternalMemoryPressure` with this value when it creates a JS wrapper, and again each time it returns a cached wrapper to JS (`cpp/core/HybridObject.cpp:68-92`). The GC does not poll it.
- Async factories return objects only after loading completes, so their first report already covers what was loaded. Later size changes are picked up the next time the object crosses into JS.
- Values are computed when the resource changes, stored atomically, and returned without locks, because Nitro reads them during conversion on the JS or worklet thread. They return 0 after disposal.
- Each runtime's wrapper reports the full size, so an object shared with the render runtime is counted by both runtimes. This is a per-runtime GC hint, not a global account, and is documented as such.
- GPU sizes are estimates (texel and attachment arithmetic), not heap sizes. Owning `ArrayBuffer`s are reported by Nitro itself. Deterministic `dispose()` stays the primary release mechanism.

| Object | Reported bytes (estimate) |
|---|---|
| `Model` | retained glTF source data (until released) + vertex, index, morph and skinning buffers + textures it owns |
| `Texture` | width × height × bytes per texel × layers × mip factor (about 4/3 with mips) |
| `IndirectLight`, `Skybox` | cubemap texels for all faces and mips |
| `Material` | package size |
| `ViewTarget`, `RenderTexture` | color and depth attachments × swapchain buffer count |
| `Snapshot` | pixel buffer size |
| `Recorder` | encoder buffer pool |
| `Engine` | configured command-buffer and handle arenas |
| `PhysicsWorld` | bodies and shapes |

**JS reload:** the `FilamentFactory` root object of each RN runtime holds the engines it created weakly. Its destruction at runtime teardown starts shutdown of those still alive. Promises destined for that RN runtime cannot settle because the runtime is going away; they are dropped with it. The render threads still finish and are joined by the IO executor. v1 starts new threads on every reload and never stops them (`FilamentProxy.java:68-71`).

**Leak detection:** debug builds expose live-object counters per type through `engine.getDebugStats()`.

### 4.8 ADR-8: Reanimated and Gesture Handler

SharedValues are pushed into binding slots by UI-runtime listeners. Gestures call controllers through bounded command queues. Details in 7.1 and 7.2.

### 4.9 ADR-9: Skia and WebGPU

Interop is a gated phase. Its design depends on a version-pinned compatibility table filled in by spike G (7.3, 7.4). No zero-copy interop is claimed until then.

### 4.10 ADR-10: Errors and logging

**Callback exceptions**
- Exceptions from user callbacks on the render thread are caught and reported through `engine.addOnErrorListener` and `console.error`.
- They never call `reportFatalError`. v1 crashes release builds this way (`package/src/ErrorUtils.ts:32`).

**Native failures** become JS `Error`s with actionable messages: invalid or foreign entity, wrong thread, disposed object, unsupported format, material parameter type mismatch.

**Logging**
- A compile-time `RNF_LOG_LEVEL` plus `Filament.setLogLevel()` at runtime.
- Android uses `__android_log_write`. This fixes the format-string bug at `package/android/src/main/cpp/RNFAndroidLogger.cpp:15`.
- iOS uses `os_log`.

---

## 5. Imperative API (Nitro)

### 5.1 Principles

**The specs are the API**
- The Nitro specs are the imperative API and are exported 1:1.
- JS code is added only for intentional higher-level helpers: `runOnRenderThread`, binding helpers, and the React layer.

**Shape**
- Factories return ready objects, and are async when setup needs IO. There is no `prepare()` step.
- One primary HybridObject per `.nitro.ts` file. Named types (structs, unions) each get their own `.ts` file. `src/index.ts` is a barrel.
- Repeated events use `addOn…Listener(cb)` returning a subscription with `remove()`.
  - Subscriptions that stay in one runtime are `ListenerSubscription` structs.
  - Subscriptions that must be removable from another runtime, such as frame listeners registered on the render runtime and removed from React, are small HybridObjects (`FrameListenerSubscription`), because a struct's function cannot cross runtimes.
- `setOn…(cb | undefined)` is used only for a single hot-path slot.

**Docs:** every exported declaration has JSDoc covering `@thread`, units, defaults, ownership and `dispose` behaviour. TypeDoc builds the API reference from it.

### 5.2 Nitro built-ins only

The whole v1 JSI layer is deleted: everything in `package/cpp/jsi/` and `package/cpp/threading/`, plus the platform dispatchers, buffers and installers. No replacement converter is written.
- No `JSIConverter` specialization.
- No `CustomType`.
- Every value that crosses JS and native is a type Nitro converts itself.

| v1 custom code | Nitro built-in that replaces it |
|---|---|
| `RNFHybridObject` (HostObject, per-instance method maps, a mutex on every property access) | Nitro `HybridObject` generated from `.nitro.ts` specs, with one prototype per class cached per runtime |
| `RNFJSIConverter.h` and all its specializations | Nitro's converters for spec types: `number`, `boolean`, `bigint`, `string`, string unions, structs, tuples, arrays, `Record`, variants, optionals, `ArrayBuffer`, `Promise`, functions, `Sync` functions, `Error`, `Date`, `AnyMap`, other HybridObjects |
| `RNFEnumMapper.h` and the `*Enum.h` headers | TS string unions; nitrogen generates the C++ enums and their conversions |
| `RNFPromise`, `RNFPromiseFactory`, `std::future` → Promise through a detached waiter thread | Nitro `Promise<T>` (`Promise<T>::async`, `create`, `resolve`, `reject`) |
| `RNFDispatcher`, `RNFCallInvokerDispatcher`, `RNFAppleDispatcher`, `RNFNSThreadDispatcher`, `JDispatcher` | Nitro `Dispatcher`; the render thread implements Nitro's `Dispatcher` interface |
| `RNFPointerHolder` (`release()`, `isValid`) | Nitro `dispose()`, overridden to drive the resource graph (4.7) |
| No memory reporting | Nitro `getExternalMemorySize()` (C++) and `memorySize` (Swift, Kotlin), see 4.7 |
| `RNFRuntimeCache`, `RNFWorkletRuntimeRegistry`, `RNFWorkletRuntimeCollector`, `RNFJSIHelper::createSharedJsiFunction` | Nitro's runtime-aware caches for functions and objects |
| `RNFListener`, `RNFListenerManager` | `ListenerSubscription` structs, and `FrameListenerSubscription` where removal crosses runtimes (5.1) |
| `RNFManagedBuffer`, `FilamentBuffer`, `AppleManagedBuffer`, `AndroidManagedBuffer` | Nitro `ArrayBuffer`: C++ `ArrayBuffer::wrap`, Swift `ArrayBuffer.wrap`, Kotlin `ArrayBuffer.wrap(ByteBuffer)` |
| Errors built as `jsi::JSError` strings | Throw `std::runtime_error` (C++), an `Error` (Swift) or a `Throwable` (Kotlin); Nitro turns it into a JS `Error` |
| TurboModule `install()`, `global.FilamentProxy`, `RNFFilamentInstaller` | Nitro autolinking (`nitro.json`) and `NitroModules.createHybridObject` |
| Codegen `FilamentViewNativeComponent`, `RNFFilamentComponent.mm`, the view managers | Nitro `HybridView`, `getHostComponent`, `callback()` and the generated view managers |
| Custom `toString` | Nitro's `toString()` override; `name` and `equals()` come from the base class |
| `cpp/test/RNFTestHybridObject` | Removed |

**The one escape hatch**
- react-native-worklets needs three things that have no Nitro spec type:
  - a JS object carrying a `worklets::AsyncQueue` as native state, for `customQueue`;
  - binding the created runtime to the render thread;
  - accepting a serialized worklet for `runOnRenderThread`.
- All three use Nitro's built-in `registerRawHybridMethod` on the `RenderThread` object:
  - `createQueue()` returns the queue object;
  - `bindRuntime(runtime)` extracts the runtime and installs the Dispatcher;
  - `runAsync(worklet, onCancelled)` queues a cancellable job (4.3).
- This is the same mechanism VisionCamera v5 uses for its `installDispatcher`. Worklets' public C++ helpers extract the native values, and `onCancelled` goes through Nitro's own function converter, so no converter is written.

### 5.3 Spec layout

```
package/src/specs/
  FilamentFactory.nitro.ts
  engine/      Engine.nitro.ts, RenderThread.nitro.ts, FrameListenerSubscription.nitro.ts
  scene/       Scene.nitro.ts, View.nitro.ts, Camera.nitro.ts, TransformManager.nitro.ts,
               RenderableManager.nitro.ts, LightManager.nitro.ts, Light.nitro.ts, Renderable.nitro.ts
  assets/      Model.nitro.ts, ModelInstance.nitro.ts, Animator.nitro.ts, AnimationPlayer.nitro.ts
  materials/   Material.nitro.ts, MaterialInstance.nitro.ts, Texture.nitro.ts, IndirectLight.nitro.ts, Skybox.nitro.ts
  control/     CameraManipulator.nitro.ts, TransformBinding.nitro.ts, ValueBinding.nitro.ts
  targets/     FilamentView.nitro.ts (HybridView), ViewTarget.nitro.ts, RenderTexture.nitro.ts,
               Recorder.nitro.ts, Snapshot.nitro.ts
  physics/     Physics.nitro.ts, PhysicsWorld.nitro.ts, RigidBody.nitro.ts, CollisionShape.nitro.ts
  platform/    internal, not exported: NativeSurface.nitro.ts, AssetIO.nitro.ts, VideoEncoder.nitro.ts
  types/       one named type per file: Float3.ts, Aabb.ts, FrameInfo.ts, EngineOptions.ts, BloomOptions.ts, ...
```

**Native source layout**
- `package/cpp/` follows the same domains: `engine/`, `scene/`, `assets/`, `materials/`, `control/`, `targets/`, `physics/`, `worklets/`, `threading/`. Correct v1 algorithms (transform math, animation sync, bullet integration) are carried over into these files rather than rewritten.
- `package/ios/` holds the Swift HybridView and platform objects, the run-loop and display-link files, and `filament.rb`.
- `package/android/src/main/java/com/margelo/nitro/filament/` holds the Kotlin HybridView and platform objects. `package/android/src/main/cpp/` holds `JNI_OnLoad`, the ALooper/AChoreographer loop and the `ANativeWindow` bridge.

### 5.4 Object inventory, v1 → v2

| v1 (JSI HostObject) | v2 (Nitro) | Implemented in | Thread class | Notes |
|---|---|---|---|---|
| `FilamentProxy` (global, TurboModule install) | `FilamentFactory`, exported as `Filament` | C++ | Async | Autolinked root; no TurboModule, no global; owns the engines of its runtime |
| `FilamentBuffer` | removed from the public API | — | — | Loaders take `AssetSource` (`{ uri }` or `ArrayBuffer`); bytes stay native |
| `EngineWrapper` / `EngineImpl` | `Engine` | C++ | mixed (4.3) | Owns render thread, loaders, managers, resource graph |
| `RendererWrapper`, `SwapChainWrapper`, `ChoreographerWrapper` | folded into `ViewTarget` and the render loop | C++ | — | No JS-driven `beginFrame`/`render`/`endFrame` |
| `SceneWrapper` | `Scene` | C++ | Render | |
| `ViewWrapper` | `View` | C++ | Render | Options as structs; `projectWorldToScreen` |
| `CameraWrapper` | `Camera` | C++ | Render | Owns entity and component; `followManipulator` |
| `TransformManagerWrapper` | `TransformManager` (+ `TransformBinding`) | C++ | Render (+ Controller) | |
| `RenderableManagerWrapper` | `RenderableManager` (+ `Renderable`) | C++ | Render | Planes, background and debug geometry are owned objects; `setAxisAlignedBoundingBox`, `scaleBoundingBox` |
| `LightManagerWrapper` | `LightManager` + `Light` | C++ | Render | One factory per light type |
| `MaterialWrapper`, `MaterialInstanceWrapper` | `Material`, `MaterialInstance` | C++ | Render | Instances keep their owner alive; `setTexture(name, texture, sampler)` |
| (textures as side effects) | `Texture` | C++ | Async create / Render use | Destroyed with its owner; no leaks |
| `FilamentAssetWrapper`, `FilamentInstanceWrapper` | `Model`, `ModelInstance` | C++ | Async load / Render / Immutable | Async `ResourceLoader`; `getInstance(i)` and `animator` are immutable; `createInstance` is render-thread |
| `AnimatorWrapper` | `Animator` + `AnimationPlayer` | C++ | Render (+ `createPlayer()` any thread) + Controller | Native playback and cross-fades; no JS per frame |
| `NameComponentManagerWrapper` | `Model.getEntityByName` / `getEntityName` | C++ | Immutable | |
| `AABBWrapper`, `BoxWrapper`, `TMat44Wrapper` | `Aabb`, `Box` structs; `Mat4` per spike F | — | Any | |
| `EntityWrapper` | `Entity = number`, validated per engine (4.6) | — | Any | |
| `ManipulatorWrapper` | `CameraManipulator` | C++ | Controller | Bounded command queue owned by the render thread; fixes the v1 data race |
| `SurfaceProvider`, `Surface`, C++ `FilamentView`, codegen component | `FilamentView` (HybridView) + internal `NativeSurface` lease + `ViewTarget` | Swift / Kotlin / C++ | Async + Render | |
| `FilamentRecorder` | `Recorder` (C++) + internal `VideoEncoder` (Swift `AVAssetWriter`, Kotlin `MediaCodec` + `MediaMuxer`) | C++ / Swift / Kotlin | Async | Rewritten: v1's render-thread `while` loops and per-frame `memcpy` break requirements 6 and 7 |
| `Listener` | `ListenerSubscription` struct or `FrameListenerSubscription` | — / C++ | Any | 5.1 |
| `Dispatcher`, `PointerHolder`, `RuntimeCache`, `JSIConverter` | Nitro built-ins: `Dispatcher`, `dispose()`, `getExternalMemorySize()`, generated conversions (5.2) | — | — | |
| Bullet wrappers | `Physics`, `PhysicsWorld`, `RigidBody`, `CollisionShape` family, in the core package | C++ | Render | Batched collision events; native step and entity binding; ownership fixes |
| `TestHybridObject` | removed | — | — | Nitro is tested upstream; behaviour covered by harness |

### 5.5 Spec sketches

These are sketches, not final signatures. They fix the shape that Phase 2 and 3 review against the api-design rules, and they are typechecked against the generated specs before the API is called settled.

```ts
// specs/FilamentFactory.nitro.ts
export interface FilamentFactory extends HybridObject<{ ios: 'c++'; android: 'c++' }> {
  /** Version of the Filament binaries, e.g. "1.78.0". @thread any */
  readonly filamentVersion: string
  /** Backends that can be created on this device. @thread any */
  readonly supportedBackends: EngineBackend[]
  /** Creates an Engine with its own render thread. @thread any */
  createEngine(options: EngineOptions): Promise<Engine>
}
```

```ts
// specs/engine/Engine.nitro.ts
export interface Engine extends HybridObject<{ ios: 'c++'; android: 'c++' }> {
  /** @thread any */
  readonly backend: EngineBackend
  /** @thread any (the managers' own methods are render-thread) */
  readonly transformManager: TransformManager
  readonly renderableManager: RenderableManager
  readonly lightManager: LightManager
  /** Cheap atomic store; wakes the render thread when demand changes (4.4). @thread any */
  renderMode: RenderMode

  /** @thread render */
  createScene(): Scene
  /** @thread render */
  createView(): View
  /** @thread render */
  createCamera(): Camera
  /** Called once per rendered frame on the render runtime. @thread render */
  addOnFrameListener(listener: Sync<(frame: FrameInfo) => void>): FrameListenerSubscription

  /** @thread any */
  loadModel(source: AssetSource, options: ModelLoadOptions): Promise<Model>
  /** @thread any */
  loadMaterial(source: AssetSource): Promise<Material>
  /** @thread any */
  loadTexture(source: AssetSource, options: TextureLoadOptions): Promise<Texture>
  /** @thread any */
  loadIndirectLight(source: AssetSource, options: IndirectLightOptions): Promise<IndirectLight>
  /** @thread any */
  loadSkybox(source: AssetSource): Promise<Skybox>
  /** @thread any */
  createViewTarget(view: FilamentView, options: ViewTargetOptions): Promise<ViewTarget>
  /** @thread any */
  createRecorder(options: RecorderOptions): Promise<Recorder>

  /** @thread any */
  createOrbitManipulator(options: OrbitManipulatorOptions): CameraManipulator
  /** Validates the entity on the owner thread; the returned binding accepts set* calls from any thread. @thread render */
  createTransformBinding(entity: Entity): TransformBinding
  /** A float slot that render-thread JS can read without touching other runtimes. @thread any */
  createValueBinding(initialValue: number): ValueBinding
  /** @thread any */
  requestFrame(): void
  /** @thread any */
  addOnErrorListener(listener: (error: Error) => void): ListenerSubscription
  /**
   * Starts shutdown if needed. Every caller receives the same Promise, which resolves after every
   * native resource is destroyed and the render thread has exited.
   * @thread RN or UI runtime; throws on the engine's own render runtime
   */
  shutdown(): Promise<void>
}

// specs/engine/FrameListenerSubscription.nitro.ts
export interface FrameListenerSubscription extends HybridObject<{ ios: 'c++'; android: 'c++' }> {
  /** Idempotent. The listener is not called after the frame in progress. @thread any */
  remove(): void
}
```

```ts
// specs/targets/FilamentView.nitro.ts
export interface FilamentViewProps extends HybridViewProps {
  /** Composite with views behind it. Uses a TextureView on Android. @default false */
  transparent: boolean
  /** Preferred presentation rate in Hz; the platform may clamp it. */
  targetFrameRate?: number
}
export interface FilamentViewMethods extends HybridViewMethods {}
export type FilamentView = HybridView<FilamentViewProps, FilamentViewMethods, { ios: 'swift'; android: 'kotlin' }>

// specs/targets/ViewTarget.nitro.ts
export interface ViewTarget extends HybridObject<{ ios: 'c++'; android: 'c++' }> {
  /** Drawable size in pixels, from the current lease. @thread any */
  readonly width: number
  /** Drawable size in pixels, from the current lease. @thread any */
  readonly height: number
  /** @thread render */
  readonly view: View
  /** @thread render */
  setScene(scene: Scene): void
  /** @thread render */
  setCamera(camera: Camera): void
  /** @thread render */
  setClearOptions(options: ClearOptions): void
  /** @thread any */
  addOnResizeListener(listener: (width: number, height: number) => void): ListenerSubscription
  /** @thread any */
  addOnFirstFrameListener(listener: () => void): ListenerSubscription
  /** Coordinates in points, origin top-left. Rejects with FilamentDisposedError if the target is disposed first. @thread any */
  pick(x: number, y: number): Promise<PickResult | undefined>
  /** @thread any */
  takeSnapshot(): Promise<Snapshot>
}
```

```ts
// specs/assets/ModelInstance.nitro.ts
export interface ModelInstance extends HybridObject<{ ios: 'c++'; android: 'c++' }> {
  /** @thread any (immutable) */
  readonly rootEntity: Entity
  /** @thread any (immutable) */
  readonly animator: Animator
  /** @thread render */
  attachSkin(skinIndex: number, target: Entity): void
}

// specs/assets/Animator.nitro.ts
export interface Animator extends HybridObject<{ ios: 'c++'; android: 'c++' }> {
  /** @thread any (immutable) */
  readonly animations: AnimationInfo[]
  /** @thread render */
  applyAnimation(animationIndex: number, timeSeconds: number): void
  /** @thread render */
  applyCrossFade(previousIndex: number, previousTimeSeconds: number, alpha: number): void
  /** @thread render */
  updateBoneMatrices(): void
  /** Creates a native player for this animator. @thread any */
  createPlayer(): AnimationPlayer
}

// specs/assets/AnimationPlayer.nitro.ts
export interface AnimationPlayer extends HybridObject<{ ios: 'c++'; android: 'c++' }> {
  /** Queued; plays natively every frame and cross-fades when crossFadeSeconds > 0. @thread any */
  play(animationIndex: number, options: PlayOptions): void
  /** @thread any */
  pause(): void
  /** @thread any */
  seek(timeSeconds: number): void
  /** @thread any */
  addOnAnimationEndListener(listener: (animationIndex: number) => void): ListenerSubscription
}

// specs/control/CameraManipulator.nitro.ts
export interface CameraManipulator extends HybridObject<{ ios: 'c++'; android: 'c++' }> {
  /** Queued and applied at the next frame start. Coordinates in points. @thread any */
  grabBegin(x: number, y: number, strafe: boolean): void
  /** Coalesced with other pending updates. @thread any */
  grabUpdate(x: number, y: number): void
  /** @thread any */
  grabEnd(): void
  /** Pending scroll deltas are summed. @thread any */
  scroll(x: number, y: number, delta: number): void
  /** @thread any */
  jumpToHome(): void
  /** Latest pose published by the render thread. @thread any */
  getLookAt(): LookAt
}

// specs/control/TransformBinding.nitro.ts
export interface TransformBinding extends HybridObject<{ ios: 'c++'; android: 'c++' }> {
  /** Stores the latest value and wakes the render thread if idle; applied at the next frame start. @thread any */
  setTranslation(x: number, y: number, z: number): void
  /** Quaternion. @thread any */
  setRotation(x: number, y: number, z: number, w: number): void
  /** @thread any */
  setScale(x: number, y: number, z: number): void
}

// specs/control/ValueBinding.nitro.ts
export interface ValueBinding extends HybridObject<{ ios: 'c++'; android: 'c++' }> {
  /** @thread any */
  set(value: number): void
  /** Latest value; never waits on another runtime. @thread any */
  readonly value: number
}
```

### 5.6 Call-site examples

Every method below has a thread class in 5.4 and 5.5.

**Setup, with cleanup on failure**

```ts
const engine = await Filament.createEngine({ backend: 'default' })
try {
  const model = await engine.loadModel({ uri: helmetUri }, { instanceCount: 1 })
  const target = await engine.createViewTarget(view, { transparent: false })
  await runOnRenderThread(engine, () => {
    'worklet'
    const scene = engine.createScene()
    scene.addModel(model)
    const camera = engine.createCamera()
    camera.setLensProjection(28, target.width / target.height, 0.1, 100)
    camera.lookAt([0, 0, 4], [0, 0, 0], [0, 1, 0])
    target.setScene(scene)
    target.setCamera(camera)
  })
  const player = model.getInstance(0).animator.createPlayer()
  player.play(0, { loop: true, speed: 1, crossFadeSeconds: 0 })
  return { engine, model, target, player }
} catch (error) {
  await engine.shutdown()
  throw error
}
```

`shutdown()` destroys anything created before the failure, including a model whose load was still in flight; that load's Promise rejects with `FilamentDisposedError`.

**A frame listener with its own lifetime**

```ts
const subscription = await runOnRenderThread(engine, () => {
  'worklet'
  return engine.addOnFrameListener((frame) => {
    engine.transformManager.setRotation(model.rootEntity, quatFromAxisAngle([0, 1, 0], frame.elapsedSeconds))
  })
})

subscription.remove()
player.dispose()
target.dispose()
model.dispose()
await engine.shutdown()
```

`subscription` is a `FrameListenerSubscription`, so React code can remove it directly. `model.dispose()` cascades to its instances, animators and players and removes its entities from every scene.

**Dispose during load**

```ts
const loading = engine.loadModel({ uri: largeModelUri }, { instanceCount: 1 })
const done = engine.shutdown()
await expect(loading).rejects.toThrow(FilamentDisposedError)
await done
```

**Errors are explicit**

```ts
scene.addEntity(entity)
// on the JS thread this throws:
// FilamentThreadError: Scene.addEntity() must run on the render thread of its Engine.
// Use runOnRenderThread(engine, ...) or call it from a frame listener.
```

---

## 6. Declarative API (React)

The React layer is rebuilt on the imperative core in Phase 4. Names stay where semantics stay, so migrating is mostly mechanical.

| v1 | v2 | Change |
|---|---|---|
| `FilamentScene` | `FilamentScene` | Either owns an Engine (it creates one) or borrows one passed as `engine`. On unmount, an owning scene calls `engine.shutdown()`. A borrowing scene disposes only what it created (its scene, views, targets, bindings, players) and removes its listeners; the borrowed engine keeps running for its other users. View options move to `FilamentView`, because they are per-View in Filament. |
| `FilamentView` + `renderCallback` | `FilamentView` | HybridView-based. Props: `transparent` (default false), `renderCallback` (render-thread worklet), `onFirstFrame`, `targetFrameRate`, and the view options (AO, bloom, TAA, dynamic resolution, dithering, anti-aliasing). Several views can share one Engine. |
| `Camera` | `Camera` | Position, target and up accept `Float3` or a `SharedValue<Float3>`. The aspect ratio follows resize events instead of per-frame polling. Takes a `manipulator`. |
| `Model`, `ModelRenderer`, `ModelInstance` | same | Async load through `engine.loadModel`. Transform props accept SharedValues (native bindings). `onPress` uses per-view picking. |
| `Animator` | `Animator` | Backed by the native `AnimationPlayer`, so no JS per frame. `animationIndex` accepts `number` or `SharedValue<number>`. |
| `Light`, `DefaultLight`, `EnvironmentalLight`, `Skybox`, `BackgroundImage`, `DebugBox`, `EntitySelector` | same names | Resources are owned and disposed on unmount. Numeric props accept SharedValues. |
| `useFilamentContext` | `useFilamentContext` | Returns `{ engine, scene, view, camera, transformManager, renderableManager, lightManager }`. `workletContext` is removed. |
| `useModel`, `useAnimator`, `useCameraManipulator`, `useSkybox`, `useLightEntity`, `useEntityInScene`, `useRecorder`, `useRecorderRenderLoop`, `useConfigureAssetShadow`, `useDisposableResource` | kept | Built on Promises and `dispose()`. No `withCleanupScope`. |
| `useBuffer` | removed | Loaders take sources directly; bytes never reach JS. |
| `useWorkletEffect`, `useWorkletCallback`, `useWorkletMemo` | `useRenderThreadEffect`, `useRenderThreadCallback`, `useRenderThreadMemo` | Built on react-native-worklets, with stale-result guards. |
| `useSyncSharedValue`, `useDerivedValue` | removed | Pass Reanimated SharedValues directly; use Reanimated's own `useDerivedValue`; read a SharedValue on the render thread through `useValueBinding(sv)`. |
| bullet hooks | same names, same package | Backed by the Nitro physics objects. |
| — | `useFrameCallback`, `useOrbitGestures`, `useAnimationPlayer`, `useTransformBinding`, `useValueBinding` | New |

**Rules for the React layer**
- StrictMode-safe: mount, unmount and mount again must leave no duplicates and no leaks.
- Ownership is explicit: whoever creates a native object disposes it. Nothing disposes a borrowed engine.
- Effects batch their render-thread mutations into one `runOnRenderThread` job per commit.
- No timers, no `InteractionManager`, no module-level mutable tables (v1's global touch table is gone).

---

## 7. Reanimated, Gesture Handler, Skia, WebGPU

### 7.1 Reanimated (priority)

**Fact:** reading a Reanimated SharedValue from a non-UI runtime is a synchronous cross-runtime call. In the pinned Reanimated 4.2.1, such reads go through `runOnUISync` (`src/mutables.ts`). In current Reanimated source, a SharedValue is a react-native-worklets `Shareable` hosted on the UI runtime, and guest reads call `getSync()`, which preempts the UI runtime under its lock. The plan does neither on the render thread (4.3).

**Bindings**
- `bindSharedValue(sv, binding)` runs `scheduleOnUI(() => sv.addListener(id, v => binding.set…(v)))` and sets the initial value. Cleanup removes the listener on the UI runtime.
- Each binding is a latest-value slot: a small struct guarded by a mutex, plus a dirty flag.
  - Writers (any thread) copy at most 64 bytes under the lock.
  - The render thread checks each binding's atomic dirty flag once per frame, locks only the dirty ones, copies the value out, then applies it without the lock.
  - After a write, the writer wakes an idle render thread through the engine's coalesced wake flag (4.4).
  - No callbacks, JS or Filament calls happen under the lock, so it never spins.
  - This is the simplest correct mechanism for this workload. A lock-free triple buffer replaces it only if spike E measures contention.
- `TransformBinding` applies translation, rotation and scale as one coherent snapshot. `ValueBinding.value` lets render-thread JS read the latest value without touching any other runtime.
- No JS-thread work. The only JS per update is the listener on the UI runtime, which runs inside Reanimated's own frame work.

**Latency (measured, not promised)**
- Definitions: `t_write` is the slot write in the UI listener; `t_consume` is the start of the render-thread frame that reads it; presentation is taken from SurfaceFlinger present timestamps for the SurfaceView layer.
- The harness asserts correctness: the value is consumed by the second frame after `t_write`.
- Performance hypothesis, confirmed against the baseline: p95 of `t_consume − t_write` ≤ 1 vsync interval on the phone in steady state.

**Props that accept `T` or `SharedValue<T>`:** transforms; camera position, target and up; light intensity, color and direction; material float and color parameters; animation index, time and weight; morph weights.

**Optional dependency:** Reanimated stays optional, loaded through a lazy module proxy (v1's `ModuleProxy` approach), so apps without it still work. react-native-worklets is a required peer.

### 7.2 Gesture Handler (priority)

**API:** the helpers use RNGH's builder API (`Gesture.Pan()`, `Gesture.Pinch()`, `Gesture.Tap()`, `Gesture.Simultaneous()`), which works with the pinned 2.30 line and is still accepted by RNGH 3. Gesture callbacks run as UI-runtime worklets.

**`useOrbitGestures(manipulator, options)`** returns a composed gesture:
- pan → `grabBegin` / `grabUpdate` / `grabEnd`;
- pinch → `scroll`;
- double tap → `jumpToHome`.

**Command queue**
- Storage: each manipulator has two preallocated buffers of 256 commands, guarded by one mutex.
  - Producers (the UI runtime for gestures, or any other thread) append to the front buffer under the lock, then wake an idle render thread through the engine's coalesced wake flag (4.4).
  - At frame start the render thread swaps front and back under the lock, applies the back buffer in order without the lock, and resets it for reuse.
  - No frame allocates.
- Ordering is FIFO in enqueue order across producers.
- Coalescing only merges adjacent commands of the same kind, and never across `grabBegin`, `grabEnd` or `jumpToHome`:
  - a `grabUpdate` replaces an immediately preceding `grabUpdate` of the same grab session, because positions are absolute and the latest wins;
  - a `scroll` merges into an immediately preceding `scroll` only when the anchor `(x, y)` is identical, summing the deltas; a different anchor is appended as its own command.
- Grab sessions: a manipulator has at most one active session, numbered at `grabBegin`. `grabUpdate` and `grabEnd` apply to the active session. A `grabBegin` from any producer while a session is active ends that session first (an implicit `grabEnd`, using the reserved entry), then starts its own. Both happen in one critical section under the queue's mutex. A `grabEnd` with no active session does nothing.
- Reserved capacity (a supported error path, not an impossible one):
  - the manipulator keeps `reservedEnd`, which is 1 from an admitted `grabBegin` until its `grabEnd` is enqueued. It is per manipulator, not per buffer, so it survives buffer swaps;
  - every producer admits any command other than `grabEnd` only if `pending + 1 + reservedEnd ≤ 256` for the front buffer. A `grabBegin` also needs room for its own future end;
  - `grabEnd` always uses the reserved entry, so it is always admitted;
  - `grabBegin`, `scroll` and `jumpToHome` throw `FilamentQueueFullError` when not admitted and change nothing;
  - a `grabUpdate` that is not admitted replaces the newest pending `grabUpdate` of its session if there is one; otherwise it throws.
- Recoverable state:
  - a rejected `grabBegin` leaves the controller as it was;
  - an admitted session always ends, because its end entry is reserved until consumed;
  - no rejection leaves a gesture stuck.
- Commands for a disposed manipulator are discarded at drain.
- Tests cover saturation, multiple producers, coalescing boundaries, waking from idle, and disposal during enqueue (11.3, 11.6).

**Picking:** a tap gesture on the UI runtime calls `viewTarget.pick(x, y)`, and the result reaches React through `scheduleOnRN`. This replaces the global touch-handler table.

**Coordinates:** everything is in points with a top-left origin and is converted natively using the content scale. v1 handled y-flip and scaling differently for manipulators and picking.

### 7.3 Skia (gated by spike G)

**Pinned facts** (@shopify/react-native-skia 2.14.0, `cpp/api/JsiSkImageFactory.h`)
- Native `MakeImageFromNativeBuffer(pointer)` exists. It wraps a CVPixelBuffer or AHardwareBuffer through the Skia context.
- `MakeImageFromNativeTexture` / `MakeNativeTextureFromImage` exchange `WGPUTexture` pointers as BigInt, and only in Graphite builds.
- `MakeImageFromGPUTexture` does not exist in 2.14.0. It, and a native `MakeImageFromNativeBuffer` that throws, exist only in unreleased Skia `main`. No 3.x is published on npm (latest 2.14.0, next 2.11.2-next.1).
- The plan targets published versions only.

**Candidate paths**
- Filament → Skia: Filament renders into a CVPixelBuffer or AHardwareBuffer target, and Skia wraps it with `MakeImageFromNativeBuffer`.
- Skia → Filament: Filament samples a buffer that Skia rendered into, as an external image.

**Spike G fills this compatibility table** before any interop API is promised:

| Item | iOS Metal | Android GLES | Android Vulkan |
|---|---|---|---|
| Package versions and exported symbols used | | | |
| Skia backend (Ganesh or Graphite) and Dawn build, where relevant | | | |
| Who owns the GPU device and the allocation | | | |
| Filament can render into the shared allocation (color target) | | | |
| Filament can sample the shared allocation | | | |
| Supported formats and usages | | | |
| Fence type, who creates and releases it, begin/end-access order | | | |
| Behaviour when unsupported: reject with an error, never a CPU fallback | | | |

Importing a camera texture successfully does not prove a color render target works; both directions are tested separately.

### 7.4 WebGPU (gated by spike G)

**Pinned facts:** `react-native-webgpu` 0.16.1 ships `GPUSharedTextureMemory`, `GPUNativeBufferTexture` and `GPUNativeBufferExternalTexture` (`cpp/rnwgpu/api/`). `react-native-wgpu` 0.5.17 is only a shim for the old 0.5 line and is not used.

**Candidate path**
- Filament renders into an IOSurface or AHardwareBuffer, and WebGPU imports it as `SharedTextureMemory`. The reverse direction uses a WebGPU-written native buffer that Filament samples.
- The same compatibility table as 7.3 applies, plus Dawn's `SharedTextureMemory` begin/end-access fences.
- Where the GPU-completion signal comes from depends on the backend:
  - on Metal, Filament's frame-completed callback;
  - on OpenGL and Vulkan, which never call that callback in 1.78.0, a fence exported with `Sync::getExternalHandle()`.
- Spike G proves the signal for each backend before that backend is marked supported.

**Out of scope:** running Filament on its own WebGPU backend with WebGPU's device. The official binaries are built with `FILAMENT_SUPPORTS_WEBGPU=OFF`.

---

## 8. Performance and zero-copy design

### 8.1 Budgets

Each budget is scoped and verified by a test or a trace (section 11).

1. **Static or native-only scenes** (no user frame listener, no active binding, no gesture): zero JS executions per frame on every runtime.
2. **A Reanimated animation driving a binding:** one UI-runtime listener call per SharedValue update, inside Reanimated's frame work; zero JS on the RN and render runtimes caused by RNF.
3. **Allocations:** steady-state render-thread frame work makes zero heap allocations (debug allocation counter).
4. **Locks on RNF's per-frame path:** only binding slots and controller queues, each held for a bounded copy and never while calling JS, Filament or platform code. Worklets' runtime mutex is taken while user listeners and render-runtime jobs run. It is expected to be uncontended, but other threads can enter that runtime through worklets itself (serialization, HMR, supported worklets operations), so this is measured in spike D rather than assumed.
5. **Thread transitions:** one per ownership boundary of an operation. For example, a load goes caller → IO thread → render thread → caller. There is no transition without a change of owner.
6. **Bytes:** asset bytes never enter JS unless the caller supplied them.
7. **Waits:** RNF code waits across threads in exactly three places, and none has a time bound:
   - the main thread waits for the render thread in SurfaceView teardown (4.5);
   - the IO executor joins a render thread during shutdown (4.7);
   - one `flushAndWait` runs at the end of an Android recording, on the recording engine's own thread (4.4).
   Separately, Filament's driver can block inside swapchain presentation for as long as the GPU, compositor or encoder takes. Queue depth limits how many frames are outstanding, not how long they take.
8. **Binding latency:** defined and gated as in 7.1.

### 8.2 Data paths

| Data | v1 | v2 |
|---|---|---|
| Bundled or `file://` model, iOS | Bundle resources are read in full; only `file://` is memory-mapped (`package/ios/src/RNFAppleFilamentProxy.mm:54-82`) | Memory-mapped `Data`/`NSData`, wrapped as an owning `ArrayBuffer`, handed to gltfio by pointer |
| Model, Android | 2–3 Java copies, then a direct buffer (`FilamentProxy.java:92-113`) | `FileChannel.map` or `AssetFileDescriptor` mmap → direct `ByteBuffer` → `ArrayBuffer`, no copy. A compressed APK entry gets one streamed read into a pre-sized direct buffer, and the docs recommend `noCompress` for `.glb`. |
| http(s) | Synchronous `dataWithContentsOfURL` / OkHttp `execute` into memory | `URLSession` / OkHttp download to a cache file keyed by URL, then mmap. Metro dev URLs are cached per session (v1 re-downloads on every mount). |
| PNG/JPEG textures | `StbProvider` push plus a busy-wait (`RNFRenderableManagerImpl.cpp:161-172`) | Decoded on an IO thread into a native buffer, then `Texture::setImage` with a release callback. KTX2/Basis go through Filament's provider. |
| User `ArrayBuffer`, read during the call (morph weights) | Element-wise `std::vector` copies | Read in place during the call; Filament copies what it keeps. No RNF copy. The caller may change or reuse the buffer as soon as the call returns. |
| User `ArrayBuffer`, consumed after the call returns (a model or texture passed as bytes) | not supported | One snapshot copy into native memory at call time, because RNF cannot stop JS from changing a buffer it can see. Bounds and format are checked before the copy. The caller may reuse the buffer as soon as the call returns. For zero copy, pass `{ uri }` so the bytes never enter JS. |
| Bytes RNF produces itself (file maps, downloads) | — | Never exposed to JS, so used in place for the whole operation: zero copy. |
| `Float3` and arrays | `std::vector<double>` per call | Tuples and structs as stack values |
| Recorder, iOS | One CVPixelBuffer plus an 8 MB `memcpy` per 1080p frame (`RNFAppleFilamentRecorder.mm:122-140`) | Render into pool CVPixelBuffers; append on the frame-completed callback (4.4, spike G) |
| Recorder, Android | Zero-copy MediaRecorder surface, but `while (isRecording)` on the render looper | Asynchronous `MediaCodec` with its input surface as the SwapChain, plus `MediaMuxer`; a pump driven by frame-scheduled callbacks, at most `N` outstanding frames, on a dedicated engine; no loops (4.4) |
| Interop | none | Gated (7.3, 7.4) |

### 8.3 Work moved out of JS

**Per-frame work that leaves JS:** animation playback and cross-fades, camera manipulation, transform bindings, physics stepping and transform sync, resize handling, and frame info.

**Per-frame JS that remains:** what the user writes in `renderCallback` or `addOnFrameListener`, and the UI-runtime binding listeners while SharedValues change.

### 8.4 Build and binary

**Compiler and linker**
- C++20; release builds with `-O2`/`-O3`.
- `-fvisibility=hidden` and `-ffunction-sections -fdata-sections` with `--gc-sections` / dead-strip.

**Filament libraries**
- Link only the Filament libraries actually used.
- Drop `filamat`, `shaders` and `smol-v` unless runtime material compilation is needed. RNF loads precompiled `.filamat` files, yet v1 links them on iOS.
- Spike A and B find the minimal link set.

**Size tracking:** report APK size per ABI, simulator app size and npm size on every release, against the v1 baseline.

---

## 9. Workarounds removed

| v1 workaround | Location | v2 replacement |
|---|---|---|
| `InteractionManager.runAfterInteractions` + `setTimeout(0)` before `release()` | `package/src/utilities/withCleanupScope.ts:23-34` | FIFO render-thread queue and the resource graph; `dispose()` enqueues destruction after earlier jobs (4.7) |
| Busy-wait polling for texture decode | `package/cpp/core/RNFRenderableManagerImpl.cpp:161-172` | Async decode with completion callbacks; Promise-based `loadTexture` |
| `FENCE_WAIT_FOR_EVER` on every resize | `package/cpp/core/RNFEngineImpl.cpp:326-332` | Size published to the target; viewport update at frame start |
| `flushAndWait` in every swapchain deleter | `package/cpp/core/RNFEngineImpl.cpp:158` | Only in surface teardown, as Filament documents (4.5) |
| Recorder `while (isReadyForMoreMediaData)` and `while (isRecording)` on the render thread | `package/ios/src/RNFAppleFilamentRecorder.mm:197`, `package/android/src/main/java/com/margelo/filament/FilamentRecorder.java:146` | Encoder readiness callbacks and BufferQueue backpressure schedule frames (4.4) |
| Per-frame `swapChain.isValid`, `latestToken`, `isSurfaceAlive`, double `onSurfaceCreated` | `package/src/react/FilamentView.tsx:41-43, 75-77, 96-104, 228-233` | Surface leases and the `ViewTarget` state machine (4.5) |
| Per-frame aspect-ratio polling | `package/src/react/Camera.tsx:82-92` | Resize listener |
| Touching `Worklets.defaultContext` to force initialisation | `package/src/native/FilamentProxy.ts:125` | Removed with worklets-core |
| patch-package for worklets-core Hermes linking | `patches/react-native-worklets-core+1.6.2.patch` | Removed with worklets-core |
| Three Filament source patches | `package/filament_*.patch` | Upstream fixes and public APIs (4.1) |
| Copying Filament's private `VirtualMachineEnv.h` and calling its `JNI_OnLoad` | `package/scripts/build-filament.sh`, `package/android/src/main/cpp/RNFFilament.cpp:12-24` | Dropped; Filament's GL platform guards its use (4.1) |
| Skipping frames while `passedSeconds <= 1` | `examples/Shared/src/PhysicsCoin.tsx:58-61` | Correct `FrameInfo` and fixed-step physics |
| Global touch-handler table | `package/src/react/TouchHandlerContext.tsx:6-24` | Per-view picking through gestures |
| Avoiding `in` on host objects | `package/src/hooks/useAnimator.ts:6-9` | Nitro prototypes make ordinary JS work |
| `Promise.resolve(syncCall)` adapters | `package/src/react/FilamentScene.tsx:53-60` | Sync/async split designed into the API |
| A detached `std::thread` per Promise | `package/cpp/jsi/RNFJSIConverter.h:148-198` | Nitro `Promise` plus `Dispatcher` |
| Inline-vs-post dispatcher behaviour differs by platform | `package/ios/src/RNFNSThreadDispatcher.mm:30-31` | One `RenderThread` semantics on both platforms |

`scaleBoundingBox` is not on this list. Enlarging bounds for animated models is a supported concept and stays (4.6).

---

## 10. Roadmap

Phases run in order, and each ends with an exit gate. Reanimated and gesture integration is validated in the first slice, not after the full rewrite.

### Phase 0: Baseline and spikes (decision gate)

- [ ] 0.1 Run one trivial harness test on the plugged-in phone and on the simulator, to prove harness 1.6 can drive both targets. If it cannot drive the phone, record that and run the same tests through `adb`-launched instrumentation.
- [ ] 0.2 Capture the v1 baseline on both targets with the 11.5 protocol: per-thread CPU, frame times and SurfaceFlinger present times, jank, memory, time to first frame, model load time, APK and simulator app size. Results go to `benchmarks/v1-baseline/`.
- [ ] **Spike A, Android download and link.**
  - Implement `prepareFilament` (Appendix A) and `FilamentLibraries.cmake`.
  - Link a Nitro C++ module that renders a triangle in the RN 0.83.1 example, once with NDK 27.1 and once with NDK 29. Check for unresolved libc++ symbols, then load and run it on the phone.
  - Run without `VirtualMachineEnv::JNI_OnLoad` on both backends. Confirm there is no assertion, and check whether Filament's ADPF hint session starts on GL. If it does not, measure the frame-time effect with an experimental local build.
  - Find the minimal library set and link order; check 16 KB page alignment.
  - Run two builds concurrently, interrupt a download and an extraction, build offline with a warm store, pass an override archive with a wrong hash (it must not be deleted), and build with `--configuration-cache`.
  - Output: the NDK requirement, the library list, and the ADPF finding.
- [ ] **Spike B, iOS download and link.**
  - Implement `filament.rb` (Appendix A) and vendor the required xcframeworks.
  - Build for the simulator (arm64) and do a generic-device link check; confirm the non-recursive header path works.
  - Confirm the Metal depth-clamp behaviour on the simulator and KTX IBL compatibility.
  - Run concurrent `pod install`s, interrupt a download, confirm a second run with the network off does no network access and no writes, and test from an `npm pack` tarball installed into a scratch app.
- [ ] **Spike C, surfaces.**
  - HybridView (Swift/Kotlin) → `NativeSurface` lease → C++ SwapChain.
  - Cover generations and stale completions, resize, SurfaceView synchronous teardown, TextureView asynchronous release, switching between the two, recycle and drop.
  - Run SurfaceView teardown while a listener is running, while jobs are queued, and while another runtime accesses the render runtime.
  - Shut down with a pick and a snapshot in flight: every posted callback is invoked exactly once, none runs owner work off the render thread, and nothing leaks (address sanitizer).
- [ ] **Spike D, render thread plus worklets** (react-native-worklets 0.7.4).
  - `customQueue` runtime creation, `bindRuntime` with `extractWorkletRuntime`, and Dispatcher install through `runSync`.
  - Frame listeners inline through `runSync` at stage 4, with stages 5–6 starting only after they return.
  - Record which route Promise continuations take on the pinned Hermes (worklets' `setImmediate` or Hermes' job queue) and apply the matching rule from 4.3.
  - Confirm that worklets' timer thread sleeps while no timer is pending, and that the Dispatcher's `runSync` throws off-thread.
  - `runOnRenderThread` racing `shutdown()` from another runtime: every call settles exactly once, by its wrapper or by cancellation.
  - Confirm shutdown settles render-runtime Promises before the runtime is released, and that the IO executor's join resolves `shutdown()`.
  - Test reload with queued jobs.
  - Measure per-frame entry cost, runtime creation cost, and runtime-mutex contention.
- [ ] **Spike E, Reanimated and RNGH.**
  - Binding latency per 7.1 and UI-thread cost.
  - Waking an idle engine from a binding write and from a gesture command, with no lost wakeups.
  - Gesture → command queue with saturation, multiple producers and coalescing boundaries.
  - Mutex slot versus lock-free triple buffer, under contention.
- [ ] **Spike F, Nitro call costs.**
  - Tuple vs primitive arguments vs `ArrayBuffer` for `Float3`/`Mat4`.
  - Struct vs HybridObject for `FrameInfo`.
  - HybridObject return caching; worklet capture (box/unbox) cost.
- [ ] **Spike G, recorder and interop.**
  - The two recording pumps of 4.4:
    - iOS: frame-completed callback plus key-value observation of `isReadyForMoreMediaData`, with pool exhaustion;
    - Android: frame-scheduled callback plus BufferQueue backpressure, codec output drain and end of stream, including whether the final `flushAndWait` is needed.
    - Both: at most `N` outstanding frames, deterministic timestamps, stop, error and cancel paths, and shutdown with frame callbacks still pending (same exactly-once check as spike C).
  - Fill the 7.3 compatibility table for Skia 2.14.0 and react-native-webgpu 0.16.1 on Metal, GLES and Vulkan, including the GPU-completion signal per backend.
- [ ] Write the ADRs in `docs/adr/` with the measurements, and update this plan.

**Exit:** every spike has a measured result and a recorded decision. Spike results are never assumed in advance.

### Phase 1: Prebuilt Filament and Nitro scaffolding, in place

- [ ] Prebuilt binaries per Appendix A; delete the submodule, build scripts, patches and the private header copy; CI caches for both stores.
- [ ] Recompile the example `.mat` files with matc 1.78 and verify the default IBL KTX.
- [ ] Review the Filament 1.68 → 1.78 API changes (TAA overhaul, material version, deprecations).
- [ ] Nitro scaffolding inside `package/`: `nitro.json`, nitrogen, podspec and CMake wiring including `NitroFilament+autolinking.cmake`, a Kotlin package that registers the HybridView manager; generated code committed, with a CI drift check.
- [ ] Remove worklets-core everywhere. Set both apps to the exact lanes in section 3: the CLI example stays on RN 0.83.1 and bumps react-native-worklets to 0.7.4; ExpoExample moves to SDK 55.0.31.
- [ ] CI baseline: install, typecheck, lint, spec drift check, clang-format, swift-format, ktlint, banned-pattern grep, Android and iOS builds of both apps, and an installed-package build from the `npm pack` tarball.

**Exit:** the example app renders a hello-triangle through a minimal HybridView and C++ engine on the phone and the simulator. `npm pack` shows no binaries.

### Phase 2: Vertical slice

- [ ] `RenderThread` (iOS run loop + display link, Android ALooper + AChoreographer), job queue, demand-driven vsync, lazy worklets binding, Dispatcher.
- [ ] Resource graph, `dispose()`, `shutdown()`, entity validation and memory reporting for the slice's objects.
- [ ] `FilamentView`, `NativeSurface` leases, `ViewTarget` state machine and teardown (4.5).
- [ ] Minimal `Engine`, `Scene`, `View`, `Camera`; async `Model` load; `AnimationPlayer`.
- [ ] Reanimated rotation through `TransformBinding`; RNGH camera gestures through `CameraManipulator`'s command queue.
- [ ] Harness: lifecycle, threading, surfaces and generations, reload, bindings, gestures. Performance A/B against v1 for ReanimatedRotation and CameraPan.

**Exit:** the slice passes on both targets; scheduler and binding decisions are recorded in the ADRs.

### Phase 3: Complete imperative API

- [ ] All specs reviewed against the api-design rules, with complete JSDoc, typechecked against the generated code.
- [ ] Platform IO in Swift and Kotlin: mmap, cached downloads, Metro dev URLs, Android raw and asset resources.
- [ ] The remaining objects of 5.4: `View` (all options), `TransformManager`, `RenderableManager` (including bounds), `LightManager` + `Light`, `Renderable`, instancing, clothing (`attachSkin` with the retarget fallback), morph targets, material variants, `Material`, `MaterialInstance`, `Texture`, `IndirectLight`, `Skybox`, background images, picking, snapshots.
- [ ] Investigate v1's shadow-clipping case and test conservative bounds at extreme skinned and morph poses.
- [ ] `Recorder` rewrite (4.4).
- [ ] Physics in the core package: world, bodies, shapes, batched collision events, native auto-step and entity binding, ownership fixes (Appendix B).
- [ ] Imperative ports of all 17 examples as harness scenarios.

**Exit:** every imperative scenario and every per-object harness suite passes on both targets.

### Phase 4: Declarative API and examples

- [ ] Components and hooks per section 6: StrictMode-safe, no timers.
- [ ] Port all 17 examples with identical visible behaviour, in both apps.
- [ ] Docs: new architecture and threading pages, updated guides, migration guide, TypeDoc API reference.

**Exit:** the full example verification matrix (11.4) is green on both targets.

### Phase 5: Skia and WebGPU (gated by spike G)

- [ ] Only the directions and backends the 7.3 table marks as supported; everything else rejects with a clear error.
- [ ] Examples: a Skia overlay on a 3D scene, a Skia texture on a model, WebGPU post-processing.

**Exit:** the supported interop examples pass on both targets with no CPU copies, verified by allocation counters and traces.

### Phase 6: Hardening and release

- [ ] A/B benchmarks against the v1 baseline; fix regressions; size report.
- [ ] Soak and stress runs; leak sweeps; ASan/UBSan builds on the phone and the simulator; TSan on the simulator.
- [ ] Release pipeline: `release-it` plus npm publish (sources only); `2.0.0-beta.x`, then `rc`, then stable.

**Exit:** every release gate in 11.7 is green.

### Follow-ups, after 2.0 parity

Each is separate and measured on its own:
- extract physics into its own package;
- the newest React Native lane (RN 0.88, worklets 0.13 `queue`, Reanimated 4.7, RNGH 3 hooks, Expo SDK 58);
- Skia APIs that are only on `main` today, once published.

---

## 11. Testing plan

### 11.1 Test layers

There are two test targets:
- **Android:** a physical phone plugged in over USB.
- **iOS:** the iOS simulator.

Everything that needs a device runs on the machine the phone is plugged into. GitHub-hosted CI covers the rest. Tests that cannot run on a target are reported as pending, never as passed.

| Layer | Tool | Runs on | When |
|---|---|---|---|
| Static | `tsc`, eslint/prettier, nitrogen drift, clang-format and clang-tidy, swift-format, ktlint, banned-pattern grep | CI (Linux, macOS) | every PR |
| Build | Gradle debug and release (arm64-v8a, armeabi-v7a, x86_64); `xcodebuild` simulator debug/release plus a generic-device link check; both apps; installed-package build | CI | every PR |
| API | react-native-harness 1.6 suites | iOS simulator in CI and locally; the phone locally | every PR (simulator); before merge for native changes (phone) |
| Example E2E | Maestro flows plus both kinds of golden image (11.4) | both targets | before merge for native or example changes; release |
| Performance | A/B benchmark protocol (11.5) | the phone; the simulator for relative CPU only | before merge for render-loop changes; release |
| Soak and stress | long runs, lifecycle cycles, races (11.6) | both targets | release |
| Sanitizers | ASan/UBSan (phone, simulator), TSan (simulator) | locally, and in CI for the simulator | weekly, release |
| Manual | dogfood checklist | both targets | every release |

### 11.2 Test targets

**Android: one physical phone plugged in over USB**
- Scripts expect exactly one device in `adb devices` and fail fast otherwise.
- Every report records the phone's model, Android version, SoC/GPU, RAM, refresh rate and thermal status, so results are comparable across runs.
- Every suite runs twice, once per engine backend: `opengl` and `vulkan`.
- ABI: arm64-v8a. If the phone supports 32-bit apps, the armeabi-v7a build is also installed and smoke-tested.
- Absolute performance targets and gates apply here (11.5).

**iOS: the simulator**
- Runs on Apple Silicon (arm64 simulator slice) with the latest iOS runtime that ships with Xcode, for example an iPhone 17 Pro simulator.
- If an older runtime (≥ 15.1) is installed, the API suites also run on it to catch availability issues.
- What the simulator cannot show:
  - real GPU timing, ProMotion pacing and thermal behaviour;
  - device-only Metal features (upstream disables depth clamp on the simulator).
- So on iOS, functional, visual, lifecycle and leak checks are gated in full. Performance is gated on CPU time only, relative to the v1 baseline on the same Mac.

**Android tooling**
- `adb` over USB on the machine the phone is plugged into.
- Debug builds use `adb reverse tcp:8081`. Performance runs use release builds without Metro.
- Traces: Perfetto (`record_android_trace`) with RNF trace sections (`RNF::frame`, `RNF::jobs`, `RNF::listeners`, `RNF::render`).
- SurfaceView frames are measured from SurfaceFlinger's per-layer present timestamps (`dumpsys SurfaceFlinger --latency '<SurfaceView layer>'` and Perfetto's SurfaceFlinger/FrameTimeline tracks), correlated with RNF trace markers. `dumpsys gfxinfo` measures only the RN UI thread.
- Memory: `dumpsys meminfo`.
- Composited screen captures: `adb exec-out screencap -p`.
- Alignment: `zipalign -c -P 16 -v 4` and `check_elf_alignment.sh` on the APK. This is a file check, so it does not depend on the phone.

**iOS tooling**
- `xcrun simctl` to boot, install, launch and read the app container; `xcrun simctl io booted screenshot` for composited captures.
- `xctrace record` on the simulator with the Time Profiler template, for relative CPU comparisons.
- `os_signpost` intervals matching the Android trace sections.
- Performance runs use the Release configuration.

**Local entry points:** `bun run test:android`, `bun run test:ios`, `bun run e2e:android`, `bun run e2e:ios`, `bun run bench:android` and `bun run bench:ios`. Each writes a report to `reports/<target>/<date>/`.

### 11.3 Harness suites

Each suite asserts behaviour, not type shape. Each defect in Appendix B gets a regression test.

| Suite | What it covers |
|---|---|
| `engine` | create, `dispose()` and `shutdown()`; backends (`opengl`/`vulkan` on Android); option mapping; wrong-thread errors; disposed-object errors from every runtime |
| `resources` | cascade on owner dispose; children after parent dispose; calls inside jobs queued before a dispose throw and reject; dispose during load; concurrent `shutdown()` callers share one Promise; `shutdown()` on the render runtime throws; `runOnRenderThread` jobs queued or pushed during shutdown reject with `FilamentDisposedError` exactly once; no native object left and the thread joined when `shutdown()` resolves |
| `entities` | stale entity after model dispose; entity without the needed component; HybridObject from Engine A passed to Engine B (`FilamentEngineMismatchError`) |
| `render-thread` | `runOnRenderThread` FIFO ordering; listeners complete before native systems and rendering in the same frame; listener order; `FrameListenerSubscription.remove()` from another runtime; exceptions routed to the error listener; Promise continuations in listeners per the 4.3 contract; `runSync` off-thread throws; a registered listener keeps frames coming in `on-demand` mode |
| `scene-sharing` | two `FilamentScene`s share one borrowed engine; unmounting one leaves the other rendering and its resources intact; the owning provider's unmount shuts the engine down |
| `buffers` | a user `ArrayBuffer` changed or reused right after an async load does not affect the loaded result; bounds and format errors; disposal during load |
| `surfaces` | mount and unmount; lease generations and stale completions; resize; rotation; background and foreground; SurfaceView and TextureView teardown; transparency switch; recycling inside a `FlatList` |
| `assets` | every source type: `require` (Metro dev URL and release bundle), `file://`, https, `ArrayBuffer`; errors (404, corrupt `.glb`); peak-RSS bound |
| `scene` / `transform` / `renderable` / `light` / `material` / `texture` | API behaviour, verified by render-thread reads and snapshots |
| `animation` | `Animator` and `AnimationPlayer`; cross-fade; clothing (`attachSkin`, retarget) |
| `bounds` | explicit and scaled bounds keep shadows unclipped at extreme skinned and morph poses |
| `morph` / `picking` / `snapshot` / `recorder` | morph weights; pick results; snapshot pixels; output files (duration, resolution, deterministic timestamps, playable) |
| `reanimated` | a binding is consumed by the second frame after its write; the listener is removed on unmount; no JS-thread tasks during animation |
| `gestures` | command order; coalescing boundaries; saturation errors and recovery (no stuck gesture); `grabEnd` admitted at full capacity across buffer swaps; a second producer's `grabBegin` ends the active session; multiple producers; waking an idle engine; disposal during enqueue |
| `physics` | step results; collision callbacks; disposal order (use-after-free regression) |
| `interop` | only after spike G: Filament → WebGPU readback pixel check; Skia image from a Filament target |

Harness configuration sketch. The exact options are confirmed by Phase 0 task 0.1.

```js
// examples/AppExampleFabric/rn-harness.config.mjs
import { androidPlatform, physicalAndroidDevice } from '@react-native-harness/platform-android'
import { applePlatform, appleSimulator } from '@react-native-harness/platform-apple'
```

Two runners are configured: `androidPlatform` with `physicalAndroidDevice('<manufacturer>', '<model>')` for the plugged-in phone, and `applePlatform` with `appleSimulator('iPhone 17 Pro', '26.0')`.

### 11.4 Example verification matrix

**Standard protocol, applied to every example on the plugged-in Android phone and the iOS simulator**

| Step | Check |
|---|---|
| P1 | Cold launch, open the example. The first frame arrives within budget, detected through `onFirstFrame` (no timers). |
| P2 | Golden images at defined states (fixed camera, fixed animation time via `seek`, TAA jitter and temporal dithering off), of two kinds: (a) `ViewTarget.takeSnapshot()`, Filament's own pixels; (b) composited screen captures, which also check SurfaceView/TextureView stacking, clipping, transparency and RN overlays. Each target has its own goldens (Android per engine backend), compared with an SSIM/pixel-diff threshold. |
| P3 | Example-specific interaction script (table below). |
| P4 | Lifecycle: background/foreground ×5, rotate ×5, navigate away and back ×10. StrictMode double mount runs in the CLI app. |
| P5 | Steady-state performance capture with the 11.5 protocol: full metrics on the phone, CPU only on the simulator. |
| P6 | After leaving the screen, the debug object counters return to baseline. |
| P7 | No error-level logs, and no warning-level logs except allow-listed ones. |
| P8 | Release build passes the same steps (R8/ProGuard on Android). |

Golden files are pulled with `adb` from the phone, or read from the simulator's app container (`xcrun simctl get_app_container`), and compared on the host. Goldens change only through an explicit, reviewed command.

**Per-example checks**

| # | Example | Features under test | Example-specific checks (P3) | Performance focus |
|---|---|---|---|---|
| 1 | Animation Transitions | 23.5 MB skinned glb, cross-fade blending, picking, scene re-creation | Animation list matches the model. Every button triggers a 5 s cross-fade with no pop. `Model onPress` alerts the entity id. "Rerender" ×20 rebuilds the engine with no growth. Navigating to Test mid-render and back works. | Load time and peak memory; zero JS per frame during cross-fade |
| 2 | Camera Pan | Remote https model, RNGH pan and pinch, orbit manipulator | Network load, including a failure path when offline. Pan rotates the orbit and pinch zooms. Pose changes are verified through `getLookAt`. Real pan and pinch are checked by hand on the phone, and in the simulator with Option-drag for pinch. | Gesture → frame latency; no JS-thread work while dragging |
| 3 | Offscreen recording | Recorder with offscreen target, animation | 300 frames produce an mp4 of about 5 s at 60 fps with the expected resolution and deterministic timestamps, and it plays in react-native-video. The render thread never runs a loop. Backgrounding during a recording fails cleanly with an error. | Encode throughput; no per-frame copy on iOS |
| 4 | Image | `BackgroundImage` with a custom material, `resizeMode` | Goldens for `cover` and `contain`; rotation re-fits the image. | First frame |
| 5 | Load from file | blob-util download, then a `file://` load | mmap path used. Peak memory stays within file size plus Filament internals. Reloaded ×10. | Load time against v1 |
| 6 | None Transparent | Opaque view, color skybox, animator, debug box | Uses SurfaceView on Android and an opaque layer on iOS. The debug box matches the AABB golden. | Frame time against v1 |
| 7 | Multiple Instances | Instancing ×4, per-instance animators, transparent view over an RN background | Four instances animate independently; the RN background shows through in the composited capture (TextureView on Android). | Render-thread CPU with four animators |
| 8 | Animated Rotate | Per-frame `renderCallback` on the render thread | Rotation advances once per frame and does not drift with frame rate (uses delta). | Cost of one user frame listener |
| 9 | Animated Rotate with Shared Values | Render-thread state driving an instance rotation | Visible behaviour matches v1. The port uses render-thread state instead of a worklets-core shared value, as documented in the migration guide. | Same as 8 |
| 10 | Reanimated Rotate | Reanimated `withSequence(withSpring, withTiming)` bound to rotation and scale | The animation completes and the final pose matches the golden. The trace shows no JS-thread tasks; values flow UI runtime → binding → render thread. | Binding latency and UI-thread cost |
| 11 | Physics Coin | bullet3 world, 4 coins, one collision callback | Coins settle within the expected bounds. Only coin A registers a callback, and it logs "Coin touched the floor!" exactly once, because it removes itself on its first floor contact (`examples/Shared/src/PhysicsCoin.tsx:39-48`); coins B–D register none. No first-frame delta spike. Leaving the screen ×10 causes no use-after-free (ASan build). | Physics step plus transform sync per frame |
| 12 | Fade Out | Opacity animation | Ported from RN `Animated` on the JS thread to a Reanimated binding. Goldens at alpha 1.0, 0.5 and 0.0. | No JS per frame |
| 13 | Cast Shadow | Shadow toggles, SSAO toggle, transparent shadow-material plane | Goldens for each toggle combination. The material is the recompiled `.filamat`. | Frame time with SSAO |
| 14 | Scale Effect | Spring scale animation | Ported from RN `Animated` to a Reanimated binding. Goldens at rest and at peak scale. | No JS per frame |
| 15 | Change Materials | Texture swap on named entities (8.9 MB PNG) | The swap applies to the "Tip" and "Wings" entities only. Decoding causes no dropped frames (async decode). | Frame times during decode |
| 16 | Skybox | KTX cubemap skybox, one directional light | Skybox golden. Mounting and unmounting ×10 leaves no leaked skybox (v1 never cleared it). | First frame |
| 17 | Morph Targets | Morph weights, scene re-creation | Goldens at `mouthOpen` 0 and 1. "Rerender" ×20 causes no growth. | Morph update cost |
| – | Test (hidden) | Navigating away while rendering | Rendering stops and resources are released. Returning resumes cleanly. | — |

Where a port changes how an example is built (rows 9, 12 and 14), the visible behaviour must match v1; the test checks behaviour, not v1's internals.

**New examples added for coverage gaps:** clothing via `attachSkin`, several views in a scrolling list, `useOrbitGestures`, and the interop examples that spike G marks as supported. They follow the same protocol.

### 11.5 Performance benchmarks and targets

**Scenarios:** each example, plus three synthetic scenes (static, 50 animated instances, 200 physics bodies), with a fixed camera path. Release builds.

**Measurement protocol**
- Same phone and same Mac for v1 and v2.
- Fixed brightness, refresh rate forced in developer settings, airplane mode, charger state recorded.
- 10 s warm-up, then 60 s of measurement.
- At least five alternating v1/v2 runs in randomized order.
- Between runs, cool down until the thermal status (`dumpsys thermalservice`) returns to its starting value.
- Report medians with bootstrap 95% confidence intervals.

**Metrics on the phone:**
- per-thread CPU per frame (JS, UI, render), at p50, p95 and p99;
- missed presentation deadlines and frame times from SurfaceFlinger present timestamps;
- time to first frame and model load time;
- peak and steady memory, and GPU memory estimate;
- render-thread allocations per frame (debug counter);
- binding and gesture latency (7.1);
- APK size per ABI and npm size.

**Metrics on the simulator:** per-thread CPU per frame, render-thread allocations, time to first frame, memory, and app size. GPU-bound numbers from the simulator are recorded but never gated.

**Targets.** These are hypotheses until the Phase 0 baseline confirms them; the baseline can only make them stricter.

| Metric | Target |
|---|---|
| JS executions per frame, static or native-only scenes | none (8.1) |
| UI-thread time attributable to RNF per frame | none, except listener cost while bindings or gestures are active (measured) |
| Render-thread CPU per frame | not worse than v1 anywhere; hypothesis: at least 20% lower in examples that ran JS per frame in v1 (Animator, Camera, AnimatedRotate, ReanimatedRotation, PhysicsCoin) |
| Missed deadlines over 60 s on the phone at its native refresh rate, single-model scenes | at most the v1 baseline; hypothesis: zero |
| Time to first frame, load time, peak load memory | not worse than v1; peak load memory has no copies proportional to file size beyond Filament internals |
| Render-thread allocations per frame | none |
| npm unpacked size | no binaries: sources and generated code only (v1: 343 MB) |

**Gate.** A change regresses a time metric when the 95% interval of the v2 − v1 difference excludes zero and the median is worse by more than 3%. A frame-count metric regresses when the absolute number of missed deadlines exceeds the baseline's by more than one per 60 s run. On the simulator only CPU-time metrics are gated.

### 11.6 Stress, lifecycle and races

- Mount/unmount `FilamentScene` ×200, and JS reload ×50 in debug: thread count and memory return to baseline.
- 30-minute soak of Animation Transitions with continuous cross-fades: memory slope ≈ 0 and no frame-time drift.
- Rapid background/foreground ×100 on the phone with SurfaceView and with TextureView: no ANR, no stale lease attached, no use of a released surface.
- Dispose races: dispose owners while queued jobs, loads, picks and snapshots are in flight; dispose from a second runtime.
- Queue saturation: 10,000 gesture commands per frame from two producers; disposal during enqueue.
- Low-memory signals: `onTrimMemory` on the phone and the simulated memory warning on iOS release caches without breaking rendering.
- A `FlatList` of 20 `FilamentView`s on one shared engine, scrolled for 60 s: recycling works, offscreen targets pause, and the phone shows no missed deadlines beyond the gate.
- Rotation and multi-window/split-screen on the phone; Split View resizing on an iPad simulator.
- Two scenes on one shared engine: mount and unmount one ×50 while the other keeps rendering.
- Binary acquisition: concurrent builds and `pod install`s, interrupted downloads and extractions, offline builds with a warm store (Appendix A).

### 11.7 CI pipelines and release gates

**Every PR, on GitHub-hosted runners**
- Static checks.
- Builds of both apps, and the installed-package build.
- Harness suites and Maestro smoke tests for 5 representative examples on the iOS simulator (macOS runner).

**On the plugged-in phone, before merging**
- Required for PRs that touch native code, the render loop or the examples.
- `bun run verify:android` runs the harness suites (both backends), the Maestro example matrix with goldens and the benchmark protocol.
- The generated report is attached to the PR.
- Optional: if the Mac the phone is plugged into runs a self-hosted GitHub runner (label `android-device`), the same job runs automatically on PRs.

**Weekly:** soak, stress and sanitizer runs on both targets.

**Release:** everything above on both targets, the manual dogfood checklist signed off on the phone and the simulator, and the size report.

### 11.8 Definition of done

- All 17 examples (and the hidden Test screen) pass the 11.4 protocol on the plugged-in Android phone (both engine backends) and the iOS simulator, in debug and release.
- Every budget in 8.1 is verified by a test or a trace.
- No workaround from section 9 remains, and the banned-pattern grep is clean.
- The 11.5 gate passes, or an exception is written down and accepted.
- Every Appendix B defect has a regression test.
- Docs are published: architecture, threading, guides, API reference and the migration guide.

---

## 12. Engineering rules

**No workarounds** (enforced by review and a CI grep over library and example code)
- Banned for sequencing or readiness:
  - `setTimeout`, `setInterval`, `setImmediate`, `requestAnimationFrame`, `InteractionManager`;
  - `sleep`, `usleep`, `std::this_thread::sleep_for`, `Thread.sleep`, `DispatchQueue.asyncAfter`, `Task.sleep`;
  - `while (true)`, busy-waits, spin loops, retry-until-stable loops, polling flags;
  - calling a method twice to make it work.
- Readiness is modelled with Promises, listeners, returned handles and state machines.
- Allowed: OS run loops and vsync callbacks, Filament's documented per-frame `asyncUpdateLoad()`, and bounded, cancellable network retries inside the download code.
- No private headers or re-declared private symbols of any dependency.

**Comments**
- Not allowed:
  - comments that restate the code;
  - commented-out code;
  - banner or section comments;
  - a TODO without a linked issue.
- Allowed: non-obvious constraints only, such as thread or lifetime contracts, OS API contracts, or a Filament quirk with an upstream link.
- Public TypeScript API: JSDoc is required, because it generates the reference docs.

**Nitro**
- Never edit generated files; change the spec and re-run nitrogen.
- One primary HybridObject per `.nitro.ts`, and one named type per `.ts`.
- Root exports are one-liners in a barrel `src/index.ts`.
- No JS facades over HybridObjects except the intentional helpers listed in 5.1.
- Nitro built-ins only (5.2):
  - no custom `JSIConverter` specializations and no `CustomType`;
  - the only escape hatch is `registerRawHybridMethod`, used for the three worklets touchpoints (5.2);
  - memory goes through `getExternalMemorySize()` (C++) and `memorySize` (Swift, Kotlin);
  - lifetime goes through `dispose()`, overridden to drive the resource graph;
  - async work goes through Nitro `Promise<T>` and `Dispatcher`;
  - bytes go through Nitro `ArrayBuffer`;
  - errors are thrown natively and converted by Nitro.

**Threads**
- Render-thread JS makes no synchronous cross-runtime calls (4.3).
- RNF native code never waits on the main thread, and never holds a lock while waiting or while calling JS, Filament or platform code.

**C++**
- C++20 and RAII; `final` classes; one primary type per file, with about 300 lines as the review signal.
- No raw owning pointers; `std::variant` for states.
- Mutexes only where state is genuinely shared across threads and a short critical section is the simplest correct choice: the binding slots and command queues (7.1, 7.2). Any other mutex needs a written justification in review.
- Thread-affinity and resource-state checks on every render-thread entry point.

**Swift**
- `final` classes, one type per file, extensions in `Type+operation.swift`.
- No `DispatchQueue.sync`, no `Task { @MainActor in }` hops.
- `Promise.parallel(queue)` for queue-owned work; platform preflight checks in focused extension files.

**Kotlin**
- `@Keep @DoNotStrip` on HybridObjects; one type per file; extensions in `Type+operation.kt`.
- `NitroModules.applicationContext` for context.
- The main thread blocks only in SurfaceView teardown (4.5).

**Hot path**
- The native render path (stages 1–3 and 5–7 in 4.4) makes no allocations, no JSI calls and no log calls per frame.
- JSI is used per frame only where 8.1 accounts for it:
  - user frame listeners on the render runtime;
  - binding listeners and gesture callbacks on the UI runtime, which call native setters while values change.

**Formatting:** clang-format (existing config), swift-format, ktlint, prettier.

---

## 13. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Google's NDK 29 static libraries against React Native's NDK 27.1 libc++ | Link or runtime failure on Android | Spike A. If needed, require NDK ≥ 29 in apps and add a Gradle check with a clear error. v1 CI already links NDK 29 Filament into NDK 27.1 apps. |
| ADPF hints may not start on the GL backend without a registered JavaVM | Some CPU-scheduling performance on GL | Spike A measures it. A material effect becomes an upstream request and a release gate, never a private header. |
| CocoaPods trunk has no Filament newer than 1.72.0 | The official pod cannot be used | Fetch the official archive during `pod install`, as React Native does for Hermes (4.1) |
| Podspec evaluation has side effects | Tools that evaluate podspecs trigger a download once | Network and writes only when the content-addressed store is cold; writes confined to our cache and our package folder; overrides for mirrors and offline |
| Build-time download fails (offline machine, proxy, GitHub outage or rate limit) | Android build or `pod install` fails | Per-machine store after the first success; CI caches keyed on `filament.json`; archive-path and mirror overrides; clear errors naming the URL and the overrides |
| A release asset changes or disappears upstream | Unverifiable binaries | SHA-256 verification refuses anything that differs; the mirror override can point at a copy in our own GitHub releases |
| react-native-worklets API churn (`customQueue` deprecated in 0.13 in favour of `queue`; `AsyncQueue` gained an abort token after 0.7) | Breakage on upgrade | Peer range bounded to `>=0.7.4 <0.8.0`; adapter isolated in one file; the follow-up lane updates it |
| Filament's frame-completed callback is Metal-only (1.78.0) | No GPU-completion signal on Android for recording or interop | Android recording uses frame-scheduled callbacks and BufferQueue backpressure (4.4); interop on OpenGL/Vulkan needs exported fences and stays gated (7.4) |
| Reanimated `SharedValue` internals change | Bindings break | Only public APIs (`scheduleOnUI`, `addListener` on the UI runtime); harness coverage |
| Limits of the HybridView surface handoff | View integration | Spike C |
| Teardown latency on Android | Main-thread stall, possibly an ANR, during `surfaceDestroyed` | Not time-bounded; this is inherent in Android's contract. Reduced by the acyclic wait graph and admission points (4.5), short-listener rules with debug timing (4.3), and the asynchronous TextureView path; exercised by spikes C and D and the stress tests |
| Skia and WebGPU APIs move between releases (Skia `main` already differs from 2.14.0) | Interop breaks | Version-pinned table from spike G; interop only for supported combinations; reject otherwise |
| Filament 1.68 → 1.78 behaviour changes (TAA overhaul, material version) | Visual differences | Recompile materials; golden images; release notes |
| Testing covers one Android phone (one GPU vendor) and the iOS simulator only | Bugs specific to other GPUs, real iPhones, ProMotion or thermals can slip through | Record the phone's details in every report; run both Filament backends; gate iOS performance only relatively; document the tested configuration in the release notes |
| A scene-specific performance regression | Misses the main goal | v1 baseline plus noise-aware per-example gates |
| v1's shadow clipping at extreme skinned and morph poses (P3.18) is not reproduced yet; bind-pose bounds can drop limbs from the shadow caster volume | Clipped shadows on animated characters | Mitigations exist (`RenderableManager.scaleBoundingBox`, `ModelInstance.recomputeBoundingBoxes`, culling off); add a pixel test once a repro scene is found. |
| Intermittent startup crash in React Native's `MountingCoordinator::pullTransaction` through Reanimated 4.2.1's mounting override, before any Filament view mounts: about 1 in 12 cold deep-link launches on the phone, with imperative and React examples alike (2026-10-18) | Example app and harness runs on Android crash at launch now and then | Upstream: Reanimated 4.7.0 serializes config updates with `pullTransaction` and 4.7.1 fixes more pull-path crashes. Retest when the Expo SDK pin allows a newer Reanimated (D17); until then captures and benchmarks relaunch after a crash and report it |
| On the iOS Simulator, Filament's default `'pcf'` shadows sample as fully shadowed, while `'vsm'` and `'dpcf'` render correctly (measured with a shadow-casting coin; Android is unaffected) | Shadows look black or missing in simulator screenshots | Views default to `'vsm'` on the simulator (D34) and the shadow tests use `'vsm'`; re-check `'pcf'` on a physical iPhone before 2.0. |

---

## 14. Decisions needed

Each has a recommended default that the plan assumes until the user says otherwise.

1. **Minimum React Native.** Default: declared range `>=0.83.0 <0.84.0`, validated by the planned lanes. 0.82 and 0.84 become supported only when a lane tests them (section 3).
2. **Default view transparency.** Default: opaque (SurfaceView / opaque layer) for performance. v1 defaulted to transparent.
3. **Commit generated nitrogen code.** Default: yes, for reviewable diffs and so consumers never need nitrogen.
4. **Self-hosted runner for the phone.** Default: no; Android device runs happen locally before merge. Saying yes makes them automatic on PRs.
5. **iOS binary acquisition.** Default: fetch during `pod install` (4.1). The alternative, a CocoaPods `:http` pod, needs one extra Podfile line in every app.

---

## 15. Decision log

| ID | Date | Decision | Source |
|---|---|---|---|
| D1 | 2026-10-17 | Android binaries: download the official `filament-*-android-native.tgz` at build time, verify it, link it directly. No Prefab, no Maven. | The user asked why a Maven Central group ID was needed. Fable answered that it was only needed for publishing a self-made Prefab AAR, and offered two options without one: (1) ship that Prefab AAR inside the npm package as a local Maven repository, or (2) skip Prefab and let a Gradle task download the official `.tgz` at build time, verify its checksum and link it with CMake. The user replied "Do 2." The user confirmed it again to codex: "Yes, direct linking is approved" (codex FEEDBACK 4). |
| D2 | 2026-10-17 | Test targets: a physical Android phone plugged in over USB, and the iOS simulator. | The user: "Use physical android plugged and ios simulator". |
| D3 | 2026-10-17 | Nitro built-ins only: delete all custom JSI converters; report memory through Nitro's `getExternalMemorySize()` and related built-ins. | The user: "Delete all JSI converters added and use that is provided by nitro inbuilt". |
| D4 | 2026-10-17 | iOS binaries fetched during `pod install`, mirroring D1. | Fable's extension of D1; open to the user's override (14.5). |
| D5 | 2026-10-18 | Keep the repository layout, keep physics in the core package, keep the RN 0.83 lane during the migration; restructuring and the newest lane are follow-ups. | Accepted from codex FEEDBACK 1, F12. |
| D6 | 2026-10-18 | No private Filament headers; ship without `VirtualMachineEnv::JNI_OnLoad`; ADPF effect measured in spike A. | Codex FEEDBACK 1, F2, with fable's verification of Filament 1.78.0 sources. |
| D7 | 2026-10-18 | Interop (Skia, WebGPU) is gated on spike G's compatibility table. | Codex FEEDBACK 1, F3, with fable's verification of the pinned packages. |
| D8 | 2026-10-18 | One exact planned validation lane per example app (CLI: RN 0.83.1, worklets 0.7.4; Expo: SDK 55.0.31) and bounded peer ranges, starting at RN `>=0.83.0 <0.84.0`. | Codex FEEDBACK 2, F20, with fable's check of the versioned package files (Appendix D). |
| D9 | 2026-10-18 | A registered frame listener is frame demand in both render modes. Demand changes from other threads post one coalesced wake job. | Codex FEEDBACK 2, F7 and F8. |
| D10 | 2026-10-18 | A user `ArrayBuffer` read after the call returns is copied once at call time; zero copy comes from `{ uri }` sources and RNF-owned bytes. | Codex FEEDBACK 2, F19. |
| D11 | 2026-10-18 | `shutdown()` is callable from the RN and UI runtimes only, shares one native Promise between callers, cancels jobs that have not started, and resolves after the IO executor joins the render thread. | Codex FEEDBACK 2, F5. |
| D12 | 2026-10-18 | The Android recording pump runs on frame-scheduled callbacks, because `setFrameCompletedCallback` is Metal-only in Filament 1.78.0. | Fable's own correction, found while answering codex FEEDBACK 2, F8. |
| D13 | 2026-10-18 | `runOnRenderThread` uses RNF's cancellable `runAsync` raw method rather than `scheduleOnRuntime`. Worklets' event loop stays on, because 0.7.4's public type only accepts `enableEventLoop: true`. | Fable's check of worklets 0.7.4 while answering codex FEEDBACK 2, F5 and F9. |
| D14 | 2026-10-18 | RNF enters the render runtime only through the runtime-lambda `runSync`. Filament callbacks run their owner work only on the render thread while the engine is `live`; after the queue closes they only release their payload, inline on the posting thread. | Codex FEEDBACK 5, F5 and F9, checked against Filament v1.78.0 `CallbackHandler.h`/`Driver.cpp` and worklets 0.7.4 `WorkletRuntime.h`. |
| D15 | 2026-10-18 | Bun monorepo hoisted at the root, library in `packages/` created with `nitrogen init`, apps in `apps/`, docs in `docs/`. Supersedes the layout part of D5. | The user, 2026-10-18. |
| D16 | 2026-10-18 | Atomic stacked PRs through `gh stack` in the private repository; each runtime change verified with screenshots on the iOS simulator and the physical Android phone; tests use react-native-harness. | The user, 2026-10-18. |
| D17 | 2026-10-18 | Both example apps use React Native 0.83.10, Expo SDK 55's pin, because a hoisted install cannot hold two React Native versions without nesting. | Follows from D15. |
| D18 | 2026-10-18 | The iOS example builds with React Native's prebuilt core and dependencies (`RCT_USE_PREBUILT_RNCORE`, `RCT_USE_RN_DEP`). With Xcode 27, RN 0.83's from-source glog cannot be built as a Clang module for Swift targets using C++ interop, which NitroModules needs. | Found while building the Nitro scaffold. |
| D19 | 2026-10-18 | Harness suites live in `apps/example/harness/`; harness resolves test files from the app directory. | Found while setting up react-native-harness. |
| D20 | 2026-10-18 | Frame listeners are `Sync<(frame: FrameInfo) => boolean>` and return whether they need another frame; in `on-demand` mode the Engine keeps rendering while any listener returns `true`. Nitro treats a void-returning function as asynchronous, so a synchronous listener must return a value; giving it a meaning replaces the 'listeners imply continuous demand' rule of D9. | Found while implementing frame listeners with Nitro 0.37.1. |
| D21 | 2026-10-18 | `dispose()` always queues native destruction as a render-thread job, also when called on the render thread, so its effects are visible from the next job on. | Found while testing model and light disposal. |
| D22 | 2026-10-18 | Each `loadModel` owns its gltfio `ResourceLoader` and texture providers until its upload finishes, so loads run concurrently. A pending load is vsync demand even before a view exists. The per-Engine `AssetLoader` and ubershader `MaterialProvider` are created on first use. | `ResourceLoader` tracks one asynchronous asset at a time (`gltfio/ResourceLoader.h`). |
| D23 | 2026-10-18 | A Scene keeps the models, skybox and indirect light set on it alive. `addEntity` does not keep the entity's owner alive; disposing or collecting a `Light` removes its entity from every scene. | Found while writing the model example. |
| D24 | 2026-10-18 | Promise rejections from Kotlin reach C++ as `facebook::jni::JniException`, which Nitro 0.37.1 reports as "Unknown … error" because the type does not match `std::exception` across libraries. RNF converts them to `std::runtime_error` with the Java message before rejecting. | Found while testing missing assets on Android. |
| D25 | 2026-10-18 | `Mat4` is a 16-number column-major tuple in TransformManager methods; binding setters take primitive arguments because they are the per-frame path. Spike F.1 can still replace the tuple if measurements show a cost. | Decided before spike F, so the TransformManager could ship. |
| D26 | 2026-10-18 | `bindSharedValue(value, apply)` accepts any `ListenableValue` (a Reanimated `SharedValue` fits structurally) and uses only `scheduleOnUI` from react-native-worklets, so Reanimated stays optional without a module proxy. | Replaces the lazy module proxy of 7.1 for bindings. |
| D27 | 2026-10-18 | Manipulator input is in points from the top-left of the view and keeps 1/16-point precision internally, because camutils takes integer pixels. `getLookAt().target` is the orbit pivot, tracked natively, because camutils reports a point one unit along the gaze. The viewport is set with `setViewport(width, height)` in points. | Found while implementing the orbit manipulator. |
| D28 | 2026-10-18 | The engine tracks which renderable primitives use RNF material instances and which samplers hold RNF textures, keeping them alive. Disposing an instance falls back to its material's default instance, disposing a material falls back to Filament's default material, and disposing a texture unbinds it, so Filament never destroys an object in use. Material files are checked for Filament's material version before parsing. | Found when Filament's in-use precondition fired during shutdown. |
| D29 | 2026-10-18 | Every render-thread job and frame runs inside a guard that logs exceptions instead of letting them reach fbjni's `ThreadScope`, where they abort the app with an unreadable `JniException`. | Found while debugging D28. |
| D30 | 2026-10-18 | Picking and snapshot completions arrive through an RNF `CallbackHandler` that posts them as render-thread jobs; each query carries a heap ticket with a weak reference to its target, so a disposed target is never touched and its pending promises are rejected. `Snapshot.saveToTemporaryFile()` replaces `saveToFile()` because JS has no portable absolute path on iOS; PNGs are encoded with zlib on a worker thread. `readPixels` already returns rows top-first on OpenGL and Metal. | Found while implementing P3.13. |
| D31 | 2026-10-18 | Planes, image backgrounds and debug boxes are `Renderable` resources that own their entity and buffers and assign their material through the engine's assignment table. The debug box draws with a built-in unlit vertex-color material that is compiled from `materials/*.mat` and embedded in the binary, so it needs no asset loading; the engine caches it weakly. `MaterialInstance.setMat3Parameter`, `RenderableManager.hasComponent` and `View.shadowType` were added for background transforms, model-wide shadow toggles and shadow filtering. A plane's bounding box keeps a tiny thickness because Filament treats any zero extent as empty and drops the plane from shadow receivers. | Found while implementing P3.7 and P3.11. |
| D32 | 2026-10-18 | `engine.createRecorder()` returns a `Recorder` with its own View; `record(frameCount)` renders on a fixed clock and resolves with an MP4 URI, replacing v1's start, stop and per-frame calls. While it records, the engine runs its frame stages only for recorder frames and pauses its view targets. Each frame stays in flight from `acquireFrame()` until the encoder accepts it, with at most 2 in flight. On Metal, every frame renders into its own `CVPixelBuffer` swap chain, destroyed after the frame-completed callback, because Filament retains the buffer for the swap chain's lifetime. On OpenGL, one swap chain wraps the codec's input surface and the frame-scheduled callback paces the pump. Filament 1.78 latches `setPresentationTime()` in `beginFrame()`, so it is called before it; otherwise `GraphicBufferSource` drops frames as going backward in time. Android disables B-frames and stamps samples `index / fps`. | Found while implementing P3.19 (spike G). |
| D33 | 2026-10-18 | Physics uses a vendored, pruned Bullet 3.25 under `vendor/bullet3`, built as a static library by CMake and as a podspec subspec with warnings off. `engine.createPhysicsWorld()` returns a world that creates its own shapes and bodies; there is no separate `Physics` root. The world keeps every body until it is disposed. Bodies keep their shapes and hold the world strongly, so the Bullet world outlives them and is destroyed after its bodies. Auto-step runs in the engine's frame stages after animation players; bound entities take the body's translation and rotation and keep their scale. Collision events are batched per step as `began`/`ended` pairs (began on penetration, ended when Bullet drops the manifold), and a listener returning `false` removes itself. Activation-state literals avoid Bullet's `ISLAND_SLEEPING`-style macros, and latency motion-state interpolation is off so poses are current. | Found while implementing P3.20. |
| D34 | 2026-10-18 | Views default to `'vsm'` shadows on the iOS Simulator only, because its Metal reports every PCF depth comparison as shadowed and models lit by a shadow-casting light render black. Devices keep Filament's `'pcf'` default. The example app opens examples through `rnfexample://<route>` links (navigated by a container ref, since React Navigation 6's linking does not apply on RN 0.83), and `scripts/capture-examples.sh` cold-launches each one for screenshots. | Found while porting the v1 examples (P3.21). |
| D35 | 2026-10-18 | Render worklet runtimes are pooled per `FilamentFactory` (one per JS runtime) and reused by later Engines instead of being destroyed. Worklets 0.7.4's `RetainingSerializable` caches values by runtime address; once objects reported external memory, the extra GC let a new runtime reuse a destroyed one's address, and worklets returned a stale value and crashed (SIGSEGV in `createWorkletRuntime`). Pooling also saves runtime start-up per Engine. Each runtime keeps one retargetable queue, and its Nitro dispatcher follows that queue, because Nitro's global dispatcher can be installed only once per runtime. Globals set by render worklets persist into the next Engine that reuses the runtime. Objects report estimated native sizes through `getExternalMemorySize()`, and `engine.getDebugStats()` counts live resources by kind. | Found while implementing P3.16. |
| D36 | 2026-10-18 | The React layer queues the render-thread work of a commit in a per-scene `RenderCommit` and runs it as one job in the microtask after the commit's effects, in submission order. Components only call setters that are documented as any-thread (bindings, players, subscriptions) outside that batch. A render-thread effect cleanup stays on the render runtime as a `RenderThreadCleanup` handle, because worklets 0.7.4 cannot unpack a worklet created on another runtime; a cleanup always runs before the next run of its effect, also when StrictMode cleans up before the first run finished. Transform props are absolute: the local transform is `translate · rotate · scale · base`, where `base` is the unit-cube fit or the entity's transform when it was first bound, and removing the props restores that transform, so StrictMode and re-renders never accumulate. `rotate` keeps v1's Euler angles. Components share the names of their native types; each name exports both the component and the type. `FilamentView.targetFrameRate` throttles only that target's rendering and keeps on-demand frames pending while it waits. | Found while implementing P4.1–P4.12. |
| D37 | 2026-10-18 | Android prefers Vulkan: `Filament.supportedBackends` lists `vulkan` before `opengl` when Vulkan 1.1 is available, so an Engine created without `backend` renders with Vulkan and falls back to OpenGL ES 3.0 elsewhere. Known risk: Filament's Vulkan backend aborts when it creates a swap chain on a null or abandoned `ANativeWindow`, where OpenGL only logs an error. The harness hit this once in three full runs, when views mount and unmount quickly; the surface and swap-chain lifetimes need a fix before 2.0 ships. | Requested after the 1.x benchmark. |
| D38 | 2026-10-18 | Surface leases are released only by their owner, after Filament has executed the swap chain's creation and destruction (4.5). A released lease reports handle 0 and is never attached, a detach that overtakes its attach releases the lease, and engine shutdown no longer releases attached leases from cancelled jobs. Android creates leases only for acquired windows, keeps one unreleased lease per view, and `surfaceDestroyed` waits for that lease instead of for a C++ promise. On Vulkan, destroying a SwapChain ends an empty headless frame, because Filament frees Vulkan swap chains only when a frame ends. | Fixes the Vulkan swap-chain aborts of D37, reproduced by the `Surfaces` harness suite: a front-queued detach overtook its attach, which then created a swap chain on an abandoned window, and shutdown released windows whose swap chains were still queued. A window handed to another Engine was still connected to the first Engine's destroyed swap chain (`native_window_api_connect() failed: Invalid argument`). |

---

## Appendix A: Prebuilt Filament download

Nothing is compiled and nothing is republished. Both platforms fetch Google's release archives on first use, verify them, publish them once into an immutable content-addressed store, and link them directly.

**Pin file** (`package/filament.json`, read by Gradle, the podspec and the scripts)

```json
{
  "version": "1.78.0",
  "baseUrl": "https://github.com/google/filament/releases/download/v1.78.0",
  "assets": {
    "android": { "name": "filament-v1.78.0-android-native.tgz", "sha256": "<pinned>" },
    "ios": { "name": "filament-v1.78.0-ios.tgz", "sha256": "<pinned>" },
    "macTools": { "name": "filament-v1.78.0-mac.tgz", "sha256": "<pinned>" }
  }
}
```

**Store layout and publication** (same rules on both platforms)
- Store root: `<GRADLE_USER_HOME>/caches/react-native-filament/` on Android, `~/Library/Caches/react-native-filament/` on iOS.
- Entry: `sha256-<hash>/archive.tgz` and `sha256-<hash>/dist/`. The hash is in the path, so an entry's content never changes.
- Download: to `sha256-<hash>/archive.<random>.part`, verify the SHA-256, then rename atomically to `archive.tgz`. If `archive.tgz` already exists because another build won the race, delete our `.part` file and use the existing one. On a mismatch, delete only our `.part` file and fail, naming the URL, the expected and actual hashes, and the override options.
- Extract: list the archive first and validate every entry. Only regular files and directories are accepted, all under the archive's top-level `filament/` directory, with no absolute paths, no `..` segments and no links. Then extract everything (all ABIs and headers) into `dist.<random>.tmp/` and rename it atomically to `dist/`; if `dist/` already exists, discard ours.
- Published entries are immutable: there are no per-ABI variants, no stamps to trust and no locks. Concurrent builds and projects converge on the same entry, and an interrupted run leaves only temporary files, which are ignored.
- Overrides:
  - a local archive (`RNF_filamentArchive` on Android, `RNF_FILAMENT_IOS_ARCHIVE` on iOS) is verified and copied into the store; the original is never modified or deleted;
  - a mirror base URL (`RNF_filamentBaseUrl`, `RNF_FILAMENT_BASE_URL`) changes only where the download comes from.

**Android: `package/android/filament.gradle`, applied from the library's `build.gradle`**
- `prepareFilament` makes sure the store entry exists (a cheap existence check when warm) and passes `dist/` to CMake as `-DFILAMENT_DIST_DIR`.
- The native configure tasks (`configureCMake*`) depend on it.
- It is written against Gradle's lazy APIs, and spike A verifies it with `--configuration-cache` rather than assuming it.

`package/android/cmake/FilamentLibraries.cmake`, included from `CMakeLists.txt`:

```cmake
set(FILAMENT_LIBS gltfio_core filament backend ...)
foreach(lib IN LISTS FILAMENT_LIBS)
  add_library(filament_${lib} STATIC IMPORTED)
  set_target_properties(filament_${lib} PROPERTIES
    IMPORTED_LOCATION ${FILAMENT_DIST_DIR}/lib/${ANDROID_ABI}/lib${lib}.a)
endforeach()
list(TRANSFORM FILAMENT_LIBS PREPEND filament_ OUTPUT_VARIABLE FILAMENT_TARGETS)
target_include_directories(NitroFilament PRIVATE ${FILAMENT_DIST_DIR}/include)
target_link_libraries(NitroFilament PRIVATE ${FILAMENT_TARGETS})
```

- `FILAMENT_LIBS` is in link order (dependents before dependencies). The full list and order come from spike A. Likely members: `filament`, `backend`, `utils`, `filabridge`, `filaflat`, `ibl`, `geometry`, `gltfio_core`, `uberarchive`, `uberzlib`, `zstd`, `dracodec`, `ktxreader`, `basis_transcoder`, `image`, `stb`, `camutils`, `bluevk`, `smol-v`, `perfetto`.
- Filament's own `android/samples/sample-cpp-viewer/CMakeLists.txt` (v1.78.0) links the same archive the same way.

**iOS: `package/ios/filament.rb`, called from the podspec when CocoaPods evaluates it**
- Makes sure the store entry exists (same rules as above, using `Digest::SHA256`, `tar` listing and `File.rename`).
- Copies `include/` and the required `lib/*.xcframework` into `ios/Filament/sha256-<hash>.<random>.tmp/` inside the package, then renames it atomically to `ios/Filament/sha256-<hash>/`. If it already exists, ours is discarded. That folder is gitignored and excluded from npm.
- With a warm store and an existing folder, evaluation does no network access and no writes.

The podspec:
- computes the `sha256-<hash>` folder from `filament.json`;
- sets `s.vendored_frameworks` to the required xcframeworks, confirmed by spike B;
- sets `HEADER_SEARCH_PATHS` to that folder's `include`, non-recursive;
- has no subspecs and no rename hacks.

**Tools**
- `scripts/filament/tools.ts` fetches and verifies `filament-v1.78.0-mac.tgz` for `matc` and `cmgen`, with the same store rules. Only contributors and CI need it.
- `scripts/filament/compile-materials.ts` runs `matc` over every `.mat` in `examples/Shared/assets` and the package. CI re-runs it and fails if the outputs differ from what is committed.
- `cmgen` regenerates `RNF_default_env_ibl.ktx` if spike B finds an incompatibility.

---

## Appendix B: v1 defects the rewrite must close

Each item gets a regression test in the harness suites (11.3).

| # | Defect | Location |
|---|---|---|
| 1 | Filament called from the JS thread while the render thread renders (about 20 call sites) | `package/src/react/FilamentScene.tsx:53-60`, `package/src/react/Configurator.tsx:54-90`, `package/src/hooks/internal/useApplyTransformations.tsx:32-77`, `package/src/react/FilamentView.tsx:72, 227, 271` |
| 2 | JNI global refs are never released, pinning `FilamentView`, `TextureView`, `SurfaceProvider`, `FilamentChoreographer`, `FilamentRecorder` and the dispatchers | `package/android/src/main/cpp/RNFJNISharedPtr.h:19` |
| 3 | `JDispatcher` runs jobs while holding its mutex, so posters (including the JS thread) block. A throwing job corrupts the queue. `runSync` unlocks from another thread (undefined behaviour). | `package/android/src/main/cpp/java-bindings/RNFJDispatcher.cpp:29-51` |
| 4 | Android `Choreographer.stop()` removes a fresh method reference, so stop followed by start yields two callbacks per vsync | `package/android/src/main/java/com/margelo/filament/FilamentChoreographer.java:58` |
| 5 | TextureView surface is released before the swapchain is destroyed | `package/android/src/main/java/com/margelo/filament/FilamentView.java:114-119` |
| 6 | `ListenerManager` keeps using an erased iterator when a callback removes itself | `package/cpp/RNFListenerManager.h:62-72` |
| 7 | Destroying the bullet world frees rigid bodies before `~btDiscreteDynamicsWorld` runs (use-after-free) | `package/cpp/bullet/RNFDiscreteDynamicWorldWrapper.h:34` |
| 8 | Leaks: the IndirectLight and its cubemap (leaked again on each call), textures, planes, background shape, debug cubes, light entities | `package/cpp/core/RNFEngineImpl.cpp:276-314`, `package/cpp/core/RNFRenderableManagerImpl.cpp`, `package/cpp/core/RNFLightManagerWrapper.cpp` |
| 9 | `MaterialInstance`, `FilamentInstance` and `Animator` wrappers hold raw pointers that can dangle | `package/cpp/core/RNFMaterialInstanceWrapper.cpp`, `RNFFilamentInstanceWrapper.cpp`, `RNFAnimatorWrapper.cpp` |
| 10 | `createPlane` reuses the first call's extents through a function-level `static` | `package/cpp/core/RNFRenderableManagerImpl.cpp:203-207` |
| 11 | Variable-length array in `loadInstancedAsset`; undefined behaviour for counts ≤ 0 | `package/cpp/core/RNFEngineImpl.cpp:242` |
| 12 | Busy-wait polling texture loader on the calling thread | `package/cpp/core/RNFRenderableManagerImpl.cpp:161-172` |
| 13 | Unbounded fence wait on every resize | `package/cpp/core/RNFEngineImpl.cpp:326-332` |
| 14 | Recorder: `while` loops on the render thread; iOS `memcpy` per frame; `_pixelBuffer` leaked; Android `_nativeWindow` uninitialized | `package/ios/src/RNFAppleFilamentRecorder.mm:122-140, 197`, `package/android/src/main/java/com/margelo/filament/FilamentRecorder.java:146`, `package/android/src/main/cpp/java-bindings/RNFJFilamentRecorder.h:41` |
| 15 | A detached `std::thread` per Promise | `package/cpp/jsi/RNFJSIConverter.h:148-198` |
| 16 | Argument count unchecked (out-of-bounds read); HostObject type checks are DEBUG-only | `package/cpp/jsi/RNFHybridObject.h:83-94`, `package/cpp/jsi/RNFJSIConverter.h:323-344` |
| 17 | Android logger passes the message as the format string | `package/android/src/main/cpp/RNFAndroidLogger.cpp:15` |
| 18 | Light type typo `focused_sport`; TS/native mismatches (`View.camera`/`View.scene`, `Material.name`, `MaterialInstance.name`, `setProjection` direction, LightManager vector types) | `package/cpp/core/RNFLightEnum.h:22, 41`, `package/src/types/*.ts` |
| 19 | TAA `upscaling` and `varianceGamma` mis-mapped; jitter error message wrong | `package/cpp/core/RNFViewWrapper.cpp:101-103, 138, 150-158` |
| 20 | `hexColorToSRGBLinear` does not linearize | `package/cpp/core/utils/RNFConverter.h:29-47` |
| 21 | `FrameInfo`: first-frame delta equals the absolute timestamp; paused time is counted in `passedSeconds` | `package/cpp/RNFChoreographerWrapper.cpp:49-66` |
| 22 | A render-callback exception is a fatal crash in release builds | `package/src/ErrorUtils.ts:32` |
| 23 | Global touch-handler table shared by every view and scene | `package/src/react/TouchHandlerContext.tsx:6-24` |
| 24 | New threads on every JS reload, never stopped | `package/android/src/main/java/com/margelo/filament/FilamentProxy.java:68-71` |
| 25 | Asset IO copies: Android 2–3 copies; iOS synchronous network download and full reads of bundle resources | `package/android/src/main/java/com/margelo/filament/FilamentProxy.java:92-113`, `package/ios/src/RNFAppleFilamentProxy.mm:42-82` |
| 26 | Camera manipulator data race between the UI thread (gestures) and the render thread | `package/cpp/core/utils/RNFManipulatorWrapper.cpp:13-41`, `package/cpp/core/RNFCameraWrapper.cpp:12-20` |
| 27 | Camera deleter destroys the entity before its component; skybox deleters run on the dropping thread | `package/cpp/core/RNFEngineImpl.cpp`, `package/cpp/core/RNFEngineImpl.Skybox.cpp:29-32, 66-70` |
| 28 | A whole frame (JS callback plus Filament render) runs inside an `@FastNative` call, delaying ART GC suspension | `package/android/src/main/java/com/margelo/filament/FilamentChoreographer.java:65-66` |
| 29 | Clothing sync computes skinning inside an open local-transform transaction (stale world transforms) and copies maps every frame | `package/cpp/core/RNFAnimatorWrapper.cpp:175-194` |

---

## Appendix C: Breaking changes and migration guide outline

**Platform requirements**
- New Architecture only.
- React Native 0.83.x (`>=0.83.0 <0.84.0`).
- `react-native-worklets` `>=0.7.4 <0.8.0` replaces `react-native-worklets-core`. The babel plugin is `react-native-worklets/plugin`.
- `react-native-nitro-modules` `>=0.37.1 <0.38.0`.
- The first Android build and the first `pod install` fetch the Filament binaries from github.com and cache them. Offline or locked-down machines set `RNF_filamentArchive` / `RNF_FILAMENT_IOS_ARCHIVE` to a local copy, or point the base-URL overrides at a mirror.
- `$RNFExcludeAssets` / `RNF_excludeAssets` and `$RNFEnableLogs` / `RNF_enableLogs` keep their meaning; their final names are fixed in Phase 1.

**Shared values**
- worklets-core shared values (`ISharedValue`) are replaced by Reanimated `SharedValue`s, or by render-thread state.
- `useSyncSharedValue` and `useDerivedValue` are removed.
- Reading a Reanimated `sv.value` inside a render callback is not supported; use `useValueBinding(sv)` and read `binding.value`.

**Threading**
- `useFilamentContext().workletContext` and `useWorkletEffect` / `useWorkletCallback` / `useWorkletMemo` are replaced by `runOnRenderThread`, `useRenderThreadEffect`, `useRenderThreadCallback` and `useRenderThreadMemo`.
- Calling render-thread APIs off the render thread throws instead of racing.

**Views and buffers**
- `FilamentView` is opaque by default; set `transparent` for v1 behaviour.
- View options move from `FilamentScene` to `FilamentView`.
- `FilamentBuffer` and `useBuffer` are removed; loaders take `{ uri }` or an `ArrayBuffer`.

**Values and types**
- Enum values are kebab-case: `'FXAA'` → `'fxaa'`, `'LOW'` → `'low'`, `'twoPassesOneSide'` → `'two-passes-one-side'`, `'frontAndBack'` → `'front-and-back'`, `'focused_point'` → `'focused-spot'`.
- `Entity` is a `number` (v1 had `{ id }`) and is validated against its Engine.
- `Mat4`, `Aabb` and `Box` are values, not host objects.
- Options are plain objects; the `create*Options()` host-object helpers are removed.

**Lifetime**
- `release()` / `isValid` become `dispose()`; `engine.shutdown()` resolves when teardown has finished.
- Disposing an owner disposes what it owns (for example a model's instances and players).
- Most components and hooks dispose automatically on unmount.

**Migration guide:** each removed v1 API gets a "before / after" snippet, taken from the example ports in Phase 4.

---

## Appendix D: Evidence (versioned links)

Every exact-version claim in this plan points at a file at that version. All links were opened on 2026-10-18. These are source checks, not execution evidence: the lanes in section 3 count as tested only after their runs pass.

**Published npm artifacts.** The unpkg links below are paths inside these immutable tarballs.

| Package | Tarball | npm `dist.integrity` |
|---|---|---|
| react-native-worklets 0.7.4 | https://registry.npmjs.org/react-native-worklets/-/react-native-worklets-0.7.4.tgz | `sha512-NYOdM1MwBb3n+AtMqy1tFy3Mn8DliQtd8sbzAVRf9Gc+uvQ0zRfxN7dS8ZzoyX7t6cyQL5THuGhlnX+iFlQTag==` |
| react-native-nitro-modules 0.37.1 | https://registry.npmjs.org/react-native-nitro-modules/-/react-native-nitro-modules-0.37.1.tgz | `sha512-KpW6EQVQ/bfegpCGxN9Be+ndvsfj56t4IESEvCASu9gWpJa/NDfHpIeIwCOvZQ3eXmLEj6YD4wCLqcC1FJPr2w==` |
| react-native-reanimated 4.2.1 | https://registry.npmjs.org/react-native-reanimated/-/react-native-reanimated-4.2.1.tgz | `sha512-/NcHnZMyOvsD/wYXug/YqSKw90P9edN0kEPL5lP4PFf1aQ4F1V7MKe/E0tvfkXKIajy3Qocp5EiEnlcrK/+BZg==` |
| @shopify/react-native-skia 2.14.0 | https://registry.npmjs.org/@shopify/react-native-skia/-/react-native-skia-2.14.0.tgz | `sha512-mzizcTeUAgvam+m1BsxTs+K8ujUXkzoCmwumUhV5NWcoImmKJiWUMfQYgw2OOt1p6qpr7+G5pPOELAmNzZRvlw==` |
| react-native-webgpu 0.16.1 | https://registry.npmjs.org/react-native-webgpu/-/react-native-webgpu-0.16.1.tgz | `sha512-bFz7fL2yJ++mUEu3D269lfRQtDIciJzrZ1qY+tBlg52tesydDTS3o8iPYPA3xqDPSl2KJtDnoPLjyNIhJ+hAaw==` |
| react-native-wgpu 0.5.17 | https://registry.npmjs.org/react-native-wgpu/-/react-native-wgpu-0.5.17.tgz | `sha512-htcAOc5vxbYBL+L5wkITka9gKMSQYI4qbt28s0nj1POePchnaYy7YQ4xRNKFp9iH+k1LsouPFY3tAn2OMSeuZg==` |
| expo 55.0.31 | https://registry.npmjs.org/expo/-/expo-55.0.31.tgz | `sha512-ZqV6jniU7twd18ADh1xP7moVrgP/BO1OTJwF2OzYnfJI9ak5cXDk+8DrV2jlgj33pMrLKqlnUvNz11zxyhwo7w==` |
| @react-native-harness/platform-android 1.6.0 | https://registry.npmjs.org/@react-native-harness/platform-android/-/platform-android-1.6.0.tgz | `sha512-Wfv3GrJLAMdHtlHd5pGgIZlmc2Aj1NSphAprKLL5GAhFxQJld4mYw5QdruwT5Kn92Vj31BAeKuKAqBq1vU7BPg==` |

**react-native-worklets 0.7.4**

| Claim | Evidence |
|---|---|
| Exports `createWorkletRuntime`, `scheduleOnRuntime`, `runOnUISync`, `executeOnUIRuntimeSync`, `scheduleOnRN`, `createSerializable`, `registerCustomSerializable`; no `runOnRuntimeAsync`, `runOnRuntimeSync` or `runOnRNSync` | https://unpkg.com/react-native-worklets@0.7.4/src/index.ts |
| `customQueue`, `useDefaultQueue: false`; `enableEventLoop` typed as `true` only | https://unpkg.com/react-native-worklets@0.7.4/src/types.ts |
| Setup worklet runs at creation; `scheduleOnRuntime` returns nothing | https://unpkg.com/react-native-worklets@0.7.4/src/runtimes.native.ts |
| `scheduleOnRN` works from worker runtimes through the JS scheduler | https://unpkg.com/react-native-worklets@0.7.4/src/threads.native.ts |
| `makeHermesRuntime()` with default configuration; `schedule` takes the lock and runs, with no microtask drain; recursive runtime mutex; `extractWorkletRuntime` | https://unpkg.com/react-native-worklets@0.7.4/Common/cpp/worklets/WorkletRuntime/WorkletRuntime.cpp and https://unpkg.com/react-native-worklets@0.7.4/Common/cpp/worklets/WorkletRuntime/WorkletRuntime.h |
| The event loop's timer thread waits on a condition variable and pushes due timers onto the runtime's queue | https://unpkg.com/react-native-worklets@0.7.4/Common/cpp/worklets/RunLoop/EventLoop.cpp |
| `setImmediate` is a zero-delay `setTimeout`; `requestAnimationFrame` is a timer; `queueMicrotask` is a JS queue | https://unpkg.com/react-native-worklets@0.7.4/lib/module/runLoop/common/setImmediatePolyfill.js, https://unpkg.com/react-native-worklets@0.7.4/lib/module/runLoop/workletRuntime/requestAnimationFramePolyfill.js, https://unpkg.com/react-native-worklets@0.7.4/lib/module/runLoop/workletRuntime/taskQueue.js |

**Other packages**

| Claim | Evidence |
|---|---|
| Nitro `dispose` clears only the calling wrapper; memory pressure is set when a wrapper is created or a cached one returned | https://unpkg.com/react-native-nitro-modules@0.37.1/cpp/core/HybridObject.cpp |
| Nitro's worklets custom serializable | https://unpkg.com/react-native-nitro-modules@0.37.1/src/worklets/installWorkletsSupport.ts |
| Reanimated 4.2.1 reads a SharedValue from another runtime through `runOnUISync` | https://unpkg.com/react-native-reanimated@4.2.1/src/mutables.ts |
| Skia 2.14.0 image factory functions | https://unpkg.com/@shopify/react-native-skia@2.14.0/cpp/api/JsiSkImageFactory.h |
| react-native-webgpu 0.16.1 peers, including worklets | https://unpkg.com/react-native-webgpu@0.16.1/package.json |
| react-native-wgpu 0.5.17 is a shim | https://unpkg.com/react-native-wgpu@0.5.17/package.json |
| Expo SDK 55.0.31 pins | https://unpkg.com/expo@55.0.31/bundledNativeModules.json |
| `physicalAndroidDevice(manufacturer, model)` | https://unpkg.com/@react-native-harness/platform-android@1.6.0/dist/factory.d.ts |
| RN's own Hermes runtime enables the microtask queue | https://github.com/facebook/react-native/blob/v0.83.1/packages/react-native/ReactCommon/react/runtime/hermes/HermesInstance.cpp#L145-L150 |
| Hermes fetched with `curl` during podspec evaluation, with a mirror override | https://github.com/facebook/react-native/blob/v0.83.1/packages/react-native/sdks/hermes-engine/hermes-utils.rb#L239-L249 |

**Filament v1.78.0**

| Claim | Evidence |
|---|---|
| `setFrameCompletedCallback` is Metal-only; `setFrameScheduledCallback` works on every backend | https://github.com/google/filament/blob/v1.78.0/filament/include/filament/SwapChain.h |
| `CallbackHandler::post` is called from a service thread; the handler must outlive pending callbacks | https://github.com/google/filament/blob/v1.78.0/filament/backend/include/backend/CallbackHandler.h |
| The service thread posts every queued callback before it stops in `~DriverBase` | https://github.com/google/filament/blob/v1.78.0/filament/backend/src/Driver.cpp#L62-L139 |
| `recomputeBoundingBoxes()` limits | https://github.com/google/filament/blob/v1.78.0/libs/gltfio/include/gltfio/FilamentInstance.h |
| Process-global `EntityManager` | https://github.com/google/filament/blob/v1.78.0/libs/utils/include/utils/EntityManager.h |
| Install rules ship only `include/backend` | https://github.com/google/filament/blob/v1.78.0/filament/backend/CMakeLists.txt#L591 |
| The native sample reaches into private headers for `VirtualMachineEnv` | https://github.com/google/filament/blob/v1.78.0/android/samples/sample-cpp-viewer/src/main/cpp/SampleAppJni.cpp |
| The JavaVM is used only when registered | https://github.com/google/filament/blob/v1.78.0/filament/backend/src/opengl/platforms/PlatformEGLAndroid.cpp#L228-L232 |
| `destroySwapChain` then `flushAndWait()` before returning from surface destruction | https://github.com/google/filament/blob/v1.78.0/android/samples/sample-hello-triangle/src/main/java/com/google/android/filament/hellotriangle/MainActivity.kt#L336-L346 |
| xcframeworks with simulator slices | https://github.com/google/filament/blob/v1.78.0/build.sh#L814-L900 |
| Release assets and the NDK used for them | https://github.com/google/filament/releases/tag/v1.78.0 and https://github.com/google/filament/blob/v1.78.0/.github/workflows/release.yml |

**Apple SDK:** `isReadyForMoreMediaData` is documented as key-value observable in `AVFoundation.framework/Headers/AVAssetWriterInput.h` (iOS 26 SDK, line 157).
