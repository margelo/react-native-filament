# react-native-filament 2.0: implementation checklist

Derived from `plan.md` **revision 6**. Revision 5 (SHA-256 `db6ab2d0…`) was accepted by fable and codex (`feedback.md`); revision 6 adds the user's layout and workflow decisions D15 and D16.

**Rules for this list**
- Every item cites the plan section it implements. If an item and the plan disagree, the plan wins; fix this list. Changing the plan needs a new review in `feedback.md`.
- Tick an item only when its evidence exists: a merged PR, a passing test, or a recorded measurement. Put the link after the item.
- IDs are stable. Use them in PR titles and commit messages (for example `P2.14`).
- Device items need both targets: the plugged-in Android phone (OpenGL and Vulkan) and the iOS simulator. A target that was not run stays unticked and is reported as pending.
- Phases run in order. A phase starts only when the previous phase's exit gate is ticked.
- Out of scope: the post-parity follow-ups in plan §10 (repository layout, a separate physics package, the newest RN lane, Skia APIs that are only on `main`).

## Contents

- [Every PR](#every-pr)
- [Phase 0: Baseline and spikes](#phase-0-baseline-and-spikes)
- [Phase 1: Prebuilt Filament and Nitro scaffolding](#phase-1-prebuilt-filament-and-nitro-scaffolding)
- [Phase 2: Vertical slice](#phase-2-vertical-slice)
- [Phase 3: Complete imperative API](#phase-3-complete-imperative-api)
- [Phase 4: Declarative API and examples](#phase-4-declarative-api-and-examples)
- [Phase 5: Skia and WebGPU](#phase-5-skia-and-webgpu)
- [Phase 6: Hardening and release](#phase-6-hardening-and-release)
- [Test infrastructure](#test-infrastructure)
- [Harness suites](#harness-suites)
- [Example verification matrix](#example-verification-matrix)
- [Stress, lifecycle and races](#stress-lifecycle-and-races)
- [Budgets and performance targets](#budgets-and-performance-targets)
- [Workarounds removed](#workarounds-removed)
- [v1 defects closed](#v1-defects-closed)
- [Removals](#removals)
- [Release gates and definition of done](#release-gates-and-definition-of-done)
- [Open decisions](#open-decisions)
- [Plan errata](#plan-errata)

---

## Every PR

Checked in review for every PR (§11.7, §12).

- [ ] The banned-pattern grep is clean. Banned for sequencing or readiness:
  - `setTimeout`, `setInterval`, `setImmediate`, `requestAnimationFrame`, `InteractionManager`;
  - `sleep`, `usleep`, `sleep_for`, `Thread.sleep`, `asyncAfter`, `Task.sleep`;
  - `while (true)`, busy-waits, spin loops, polling flags, retry-until-stable loops, calling a method twice.
- [ ] No private headers or re-declared private symbols of any dependency.
- [ ] Comments:
  - only for non-obvious constraints (thread or lifetime contracts, OS contracts, Filament quirks with an upstream link);
  - none that restate code, no commented-out code, no banners, no TODO without an issue;
  - JSDoc on every exported TS declaration, covering `@thread`, units, defaults, ownership and `dispose`.
- [ ] Nitro:
  - generated files are not edited by hand;
  - one primary HybridObject per `.nitro.ts` and one named type per `.ts`;
  - `src/index.ts` is a barrel;
  - no `JSIConverter` specialization and no `CustomType`;
  - raw methods only for the worklets touchpoints (§5.2).
- [ ] C++: C++20, RAII, `final` classes, one primary type per file (about 300 lines is the review signal), no raw owning pointers.
- [ ] Swift: `final` classes, one type per file, extensions in `Type+operation.swift`, no `DispatchQueue.sync`, no `Task { @MainActor in }` hops.
- [ ] Kotlin: `@Keep @DoNotStrip` on HybridObjects, one type per file, extensions in `Type+operation.kt`.
- [ ] Locks and waits:
  - mutexes only for binding slots and command queues; any other mutex has a written justification;
  - no lock held while waiting or while calling JS, Filament or platform code;
  - RNF native code never waits on the main thread.
- [ ] Render stages 1–3 and 5–7 make no allocations, JSI calls or log calls per frame (§12 hot path).
- [ ] CI is green: static checks, builds of both apps, the installed-package build, and harness plus Maestro smoke on the iOS simulator.
- [ ] Native, render-loop or example changes: the `bun run verify:android` report (both backends) is attached to the PR.

---

## Phase 0: Baseline and spikes

Plan §10 Phase 0. The exit is a decision gate: every spike has a measured result and a recorded decision. No spike result is assumed in advance.

**Setup**
- [x] **P0.0** Stacked branches `nitro/NN-topic` managed with `gh stack`, one atomic PR each. Cut a `v1` maintenance branch from `main` (§4.2, D16).
- [x] **P0.0b** Bun monorepo hoisted at the root: `packages/react-native-filament`, `apps/example`, `apps/expo-example`, `apps/shared`, `docs/`; no `node_modules` outside the root (D15).
- [x] **P0.1** One trivial harness test runs on the plugged-in phone and on the simulator (harness 1.6). If the phone cannot be driven, record that and run through `adb`-launched instrumentation instead.
- [ ] **P0.2** Capture the v1 baseline on both targets with the §11.5 protocol into `benchmarks/v1-baseline/`:
  - per-thread CPU, frame times, SurfaceFlinger present times and jank;
  - memory, time to first frame and model load time;
  - APK size and simulator app size.

**Spike A: Android download and link** (§4.1, Appendix A)
- [ ] **A.1** `package/filament.json` pins version 1.78.0 and the SHA-256 of the `android`, `ios` and `macTools` assets.
- [ ] **A.2** `prepareFilament` in `package/android/filament.gradle`:
  - content-addressed store under `<GRADLE_USER_HOME>/caches/react-native-filament/`;
  - `.part` download, verify, then atomic rename;
  - archive listing validated before extraction (regular files and directories only, under `filament/`, no absolute paths, no `..`, no links);
  - `dist.<random>.tmp/` renamed to `dist/`;
  - `-DFILAMENT_DIST_DIR` passed to CMake; `configureCMake*` depends on the task; lazy Gradle APIs.
- [ ] **A.3** `package/android/cmake/FilamentLibraries.cmake` declares `IMPORTED` static libraries in link order.
- [ ] **A.4** A Nitro C++ module renders a triangle in the RN 0.83.1 example. Build once with NDK 27.1 and once with NDK 29; no unresolved libc++ symbols; loads and runs on the phone.
- [ ] **A.5** Without `VirtualMachineEnv::JNI_OnLoad`:
  - no assertion on OpenGL or Vulkan;
  - check whether the ADPF hint session starts on GL;
  - if it does not, measure the frame-time effect with an experimental local build.
- [ ] **A.6** The minimal library set and link order are found, and 16 KB page alignment is checked.
- [ ] **A.7** Robustness:
  - two concurrent builds;
  - an interrupted download and an interrupted extraction;
  - an offline build with a warm store;
  - an override archive with a wrong hash, which is left in place, not deleted;
  - a build with `--configuration-cache`.
- [ ] **A.8** Record the NDK requirement, the library list and the ADPF finding in ADR-1. A material ADPF effect becomes an upstream request and a release gate, never a private header (§4.1, §13).

**Spike B: iOS download and link** (§4.1, Appendix A)
- [ ] **B.1** `package/ios/filament.rb`:
  - same store rules, under `~/Library/Caches/react-native-filament/`;
  - publishes an immutable `ios/Filament/sha256-<hash>/` folder through a `.tmp` folder and an atomic rename;
  - the folder is gitignored and excluded from npm.
- [ ] **B.2** Podspec:
  - computes the folder from `filament.json`;
  - `vendored_frameworks` lists the required xcframeworks;
  - non-recursive `HEADER_SEARCH_PATHS`;
  - no subspecs and no `gltfio/math.h` rename hack.
- [ ] **B.3** The simulator (arm64) builds and the generic-device link check passes.
- [ ] **B.4** The Metal depth-clamp behaviour on the simulator and the KTX IBL compatibility are confirmed.
- [ ] **B.5** Robustness:
  - concurrent `pod install`s;
  - an interrupted download;
  - a second run with the network off does no network access and no writes;
  - install from an `npm pack` tarball into a scratch app.

**Spike C: surfaces** (§4.5, §4.7)
- [ ] **C.1** The chain works end to end: HybridView (Swift, Kotlin) → `NativeSurface` lease → C++ SwapChain.
- [ ] **C.2** Covers:
  - lease generations and stale completions;
  - resize;
  - SurfaceView synchronous teardown and TextureView asynchronous release, and switching between them;
  - recycle and drop.
- [ ] **C.3** SurfaceView teardown while a listener runs, while jobs are queued, and while another runtime accesses the render runtime.
- [ ] **C.4** Shutdown with a pick and a snapshot in flight:
  - every posted Filament callback is invoked exactly once;
  - none runs owner work off the render thread;
  - address sanitizer reports no leak.

**Spike D: render thread plus worklets 0.7.4** (§4.3)
- [x] **D.1** Runtime setup works: creation with `customQueue`, `bindRuntime` with `extractWorkletRuntime`, and the Dispatcher installed through the runtime-lambda `runSync`.
- [x] **D.2** Frame listeners run inline at stage 4, and stages 5–6 start only after they return.
- [x] **D.3** Promise continuations:
  - record the route on the pinned Hermes (worklets' `setImmediate` or Hermes' job queue) and apply the matching §4.3 rule;
  - gate: Promises created by a listener and by a `runOnRenderThread` job settle on an otherwise idle engine;
  - if they do not, the spike fails and the lane changes.
- [ ] **D.4** Worklets' timer thread sleeps while no timer is pending, and the Dispatcher's `runSync` throws off-thread.
- [x] **D.5** `runOnRenderThread` racing `shutdown()` from another runtime: every call settles exactly once, by its wrapper or by cancellation.
- [ ] **D.6** Shutdown and reload:
  - shutdown settles render-runtime Promises before the runtime is released;
  - the IO executor's join resolves `shutdown()`;
  - reload with queued jobs works.
- [ ] **D.7** Measure per-frame entry cost, runtime creation cost and runtime-mutex contention.

**Spike E: Reanimated and RNGH** (§7.1, §7.2)
- [ ] **E.1** Binding latency per §7.1 (consumed by the second frame after the write; p95 hypothesis ≤ 1 vsync), and UI-thread cost.
- [ ] **E.2** Waking an idle engine from a binding write and from a gesture command, with no lost wakeups.
- [ ] **E.3** Gesture → command queue: saturation, multiple producers, coalescing boundaries.
- [ ] **E.4** Mutex slot versus lock-free triple buffer, under contention. The result is recorded in the ADR.

**Spike F: Nitro call costs** (§4.6)
- [ ] **F.1** Tuple vs primitive arguments vs `ArrayBuffer` for `Float3` and `Mat4`. This decides the `Mat4` representation.
- [ ] **F.2** Struct vs HybridObject for `FrameInfo`.
- [ ] **F.3** HybridObject return caching, and worklet capture (box/unbox) cost.

**Spike G: recorder and interop** (§4.4, §7.3, §7.4)
- [x] **G.1** iOS pump:
  - frame-completed callback plus key-value observation of `isReadyForMoreMediaData`;
  - pool exhaustion;
  - a frame that completes while the input is not ready is held.
- [x] **G.2** Android pump:
  - frame-scheduled callback, BufferQueue backpressure, codec output drain, end of stream;
  - decide whether the final `flushAndWait` is needed.
- [x] **G.3** Both pumps:
  - at most `N` (default 2) frames outstanding, with deterministic timestamps;
  - stop, error and cancel paths;
  - shutdown with frame callbacks pending, with the same exactly-once check as C.4.
- [ ] **G.4** Fill the §7.3 compatibility table for Skia 2.14.0 and react-native-webgpu 0.16.1 on Metal, GLES and Vulkan, including the GPU-completion signal per backend.

**Records**
- [ ] **P0.3** ADRs written in `docs/adr/` with the measurements. Any plan change goes through review.
- [ ] **Exit gate:** every spike has a measured result and a recorded decision.

---

## Phase 1: Prebuilt Filament and Nitro scaffolding

Plan §10 Phase 1, §4.1, §4.2, Appendix A.

**Binaries and tools**
- [x] **P1.1** Prebuilt binaries on both platforms, as built in spikes A and B. Overrides:
  - `RNF_filamentArchive` / `RNF_FILAMENT_IOS_ARCHIVE`;
  - `RNF_filamentBaseUrl` / `RNF_FILAMENT_BASE_URL`.
- [x] **P1.2** Error messages name the URL, the expected and actual hashes, and the override options.
- [ ] **P1.3** `scripts/filament/tools.ts` fetches and verifies `filament-v1.78.0-mac.tgz` (`matc`, `cmgen`) with the same store rules.
- [ ] **P1.4** `scripts/filament/compile-materials.ts` recompiles `examples/Shared/assets/*.mat` and the package materials with matc 1.78. CI fails on drift.
- [ ] **P1.5** The default IBL KTX (`RNF_default_env_ibl.ktx`) is verified, and regenerated with `cmgen` if spike B found a problem.
- [x] **P1.6** CI caches both stores, keyed on `filament.json`.
- [ ] **P1.7** Bullet is compiled from a vendored, pruned source set (zlib license) by the package's CMake and podspec.
- [ ] **P1.8** Build settings (§8.4):
  - C++20, release builds at `-O2`/`-O3`;
  - `-fvisibility=hidden`, `-ffunction-sections -fdata-sections` with `--gc-sections` or dead-strip;
  - only the Filament libraries actually used, from spikes A and B. `filamat`, `shaders` and `smol-v` are dropped unless runtime material compilation is needed.
- [ ] **P1.9** Review the Filament 1.68 → 1.78 API changes (TAA overhaul, material version, deprecations) and write the notes down.

**Nitro scaffolding**
- [x] **P1.10** Nitro wiring in `package/`:
  - `nitro.json` and nitrogen 0.37.1;
  - podspec and CMake wiring, including `NitroFilament+autolinking.cmake`;
  - a Kotlin package that registers the HybridView manager.
- [x] **P1.11** Naming: C++ namespace `margelo::nitro::filament`, Kotlin package `com.margelo.nitro.filament`, and an iOS module name that matches the existing podspec.
- [x] **P1.12** Generated code is committed, with a CI drift check (§14.3).

**Dependencies and lanes** (§3)
- [x] **P1.13** worklets-core is removed everywhere, including `patches/react-native-worklets-core+1.6.2.patch`. The babel plugin is `react-native-worklets/plugin`.
- [x] **P1.14** The CLI example is pinned to the §3 lane: RN 0.83.10, react 19.2.0, worklets 0.7.4, Reanimated 4.2.1, RNGH 2.30.0, Nitro 0.37.1, harness 1.6.0.
- [x] **P1.15** ExpoExample moves to SDK 55.0.31 with worklets 0.7.4.
- [x] **P1.16** Library peer ranges:
  - RN `>=0.83.0 <0.84.0`;
  - Nitro `>=0.37.1 <0.38.0`;
  - worklets `>=0.7.4 <0.8.0`;
  - Reanimated, optional, `>=4.2.1 <4.3.0`;
  - RNGH, optional, `>=2.30.0 <3.0.0`.
  - Skia and WebGPU are not peers.

**CI**
- [x] **P1.17** CI baseline:
  - install, typecheck, lint, spec drift, clang-format, swift-format, ktlint, banned-pattern grep;
  - Android and iOS builds of both apps;
  - an installed-package build from the `npm pack` tarball.

**Exit**
- [ ] **Exit gate:**
  - a hello-triangle renders through a minimal HybridView and C++ engine on the phone and on the simulator;
  - `npm pack` contains no binaries.

---

## Phase 2: Vertical slice

Plan §10 Phase 2. Reanimated and gestures are proven here, not after the full rewrite.

**Render thread** (§4.3, §4.4)
- [ ] **P2.1** iOS:
  - a dedicated thread with its own run loop and a `CADisplayLink` on that run loop;
  - jobs posted with `CFRunLoopPerformBlock` plus `CFRunLoopWakeUp`;
  - `preferredFrameRateRange` set.
- [ ] **P2.2** Android:
  - a thread that calls `ALooper_prepare`, with jobs delivered through an `eventfd` registered with `ALooper_addFd`;
  - `AChoreographer_postFrameCallback64` on API 29+ and `AChoreographer_postFrameCallback` on API 24–28;
  - measured against the Java `Choreographer` fallback.
- [x] **P2.3** Job queue:
  - FIFO, with surface-teardown jobs at the front;
  - every job has a run path and a cancel path;
  - closed under its lock, after which pushes are refused.
- [ ] **P2.4** One iteration runs stages 1–7 in order.
  - The listener list is snapshotted at stage 4.
  - A dispose during stage 4 skips the rest of that frame.
  - `beginFrame` returning false skips the frame; it is never queued.
- [ ] **P2.5** Frame demand per §4.4. Vsync is re-armed only while there is demand, and jobs wake the thread whether or not a surface exists.
- [ ] **P2.6** Wake protocol:
  - the producer publishes, then posts a wake job only if `wakePending.exchange(true)` returned false;
  - the wake job stores false first, then drains and recomputes demand;
  - producers are binding writes, controller commands, `requestFrame()`, `renderMode` changes and listener add/remove.
- [ ] **P2.7** Render modes `continuous` and `on-demand`. The `renderMode` setter wakes the thread when demand changes. A registered frame listener counts as demand in both modes.
- [ ] **P2.8** `FrameInfo` is `{ timestampNs, deltaSeconds, elapsedSeconds, frameIndex }`, with `deltaSeconds` 0 on the first frame and after resume.
- [ ] **P2.9** `targetFrameRate` maps to `preferredFrameRateRange` on iOS, and to `SwapChain::setFrameRate` plus `FrameRateOptions` on Android.
- [ ] **P2.10** A thread-local check on every render-thread entry throws `FilamentThreadError` in every build. Every method carries its `@thread` class.

**Worklets binding** (§4.3, §5.2)
- [x] **P2.11** `RenderThreadQueue` implements `worklets::AsyncQueue`. Raw method `createQueue()` returns it.
- [x] **P2.12** Lazy runtime creation on the RN thread: `createWorkletRuntime({ name, useDefaultQueue: false, customQueue })`.
  - no RNF initializer;
  - the event loop is left at its default;
  - RNF's JS code does not keep the runtime object.
- [x] **P2.13** Raw method `bindRuntime(runtime)`:
  - calls `extractWorkletRuntime` and installs the Nitro `Dispatcher`;
  - the Dispatcher's `runAsync` queues a job;
  - its `runSync` runs inline on the render thread and throws elsewhere.
- [x] **P2.14** Every entry uses the runtime-lambda `runSync([&](jsi::Runtime&) { … })`. Never the `jsi::Function` or `SerializableWorklet` overloads, and never `schedule(std::function<void()>)`.
- [x] **P2.15** `runOnRenderThread(engine, worklet)` JS helper:
  - a `createSerializable` wrapper settles through `scheduleOnRN(resolve | reject)`;
  - raw method `runAsync(wrapper, onCancelled)` extracts it with `extractSerializableOrThrow` and converts `onCancelled` with Nitro's function converter;
  - exactly-once settlement.
- [x] **P2.16** Promise-continuation rule applied as spike D decided. `drainMicrotasks()` is called at the end of each entry only on the Hermes job-queue route. No private worklets globals.
- [ ] **P2.17** Debug builds time each listener and report overruns (default 4 ms) through `engine.addOnErrorListener`.
- [ ] **P2.18** Callback exceptions are caught and reported through `addOnErrorListener` and `console.error`, never `reportFatalError` (§4.10).

**Ownership, disposal, shutdown** (§4.7)
- [x] **P2.19** Resource graph basics:
  - `EngineContext` and `ResourceHandle` with an atomic `live → disposing → destroyed` state shared by every wrapper;
  - children hold their parents strongly, owners hold children weakly.
- [x] **P2.20** Every method checks the state and throws `FilamentDisposedError` unless `live`.
  - The `dispose()` override compare-and-sets, marks descendants and queues one destruction job.
  - The destruction job removes entities from scenes, severs non-owning references, destroys children first, then marks handles `destroyed`.
- [ ] **P2.21** Controller and immutable methods touch only memory their HybridObject owns, never Filament objects.
- [ ] **P2.22** Pending-operation registry: each operation settles exactly once.
  - IO tasks hold CPU memory and a token, never Filament objects.
  - A refused completion offer frees its buffers and stops.
- [x] **P2.23** GC path: the last native reference queues the destruction job. Destructors never call Filament.
- [ ] **P2.24** `shutdown()`:
  - compare-and-set at call time; one shared native Promise;
  - RN and UI runtimes only, `FilamentThreadError` on the render runtime;
  - `dispose()` on an engine starts shutdown without a result.
- [ ] **P2.25** The shutdown job runs steps 1–6 of §4.7. The IO executor's join task (submitted as the thread's last act) joins the thread, marks the engine `destroyed`, then resolves the Promise.
- [ ] **P2.26** `CallbackHandler`:
  - `post()` creates a job; owner work runs only on the render thread while the engine is `live`;
  - the cancel path only releases its payload;
  - a `post()` after the queue closed runs release-only inline;
  - the handler is owned by `EngineContext`.
- [ ] **P2.27** `FilamentFactory` holds engines weakly, and runtime teardown shuts down the live ones. No threads survive a reload.
- [ ] **P2.28** JS values live only in listener registries, pending resolvers and the `WorkletRuntime` reference, and each is cleared by `remove()`, settlement or shutdown.
- [ ] **P2.29** Memory reporting for the slice's objects: `getExternalMemorySize()` (C++) and `memorySize` (Swift, Kotlin) per the §4.7 table, stored atomically, 0 after disposal.
- [ ] **P2.30** Debug live-object counters through `engine.getDebugStats()`.

**Entities, errors, logging** (§4.6, §4.10)
- [ ] **P2.31** The entity policy table is enforced on the render thread:
  - `FilamentInvalidEntityError` for entity problems;
  - `FilamentEngineMismatchError` for objects from another engine (pointer equality on `EngineContext`).
- [ ] **P2.32** Native failures become actionable JS errors (invalid entity, wrong thread, disposed object, unsupported format, parameter type mismatch).
- [ ] **P2.33** Logging: compile-time `RNF_LOG_LEVEL` plus `Filament.setLogLevel()`. `__android_log_write` on Android (fixes the format-string bug), `os_log` on iOS.

**Views and surfaces** (§4.5)
- [ ] **P2.34** `FilamentView` HybridView:
  - iOS: a Swift `UIView` with a `CAMetalLayer`;
  - Android: a Kotlin `FrameLayout` hosting a `SurfaceView` (default) or a `TextureView` when `transparent` is set;
  - props `transparent` (default false) and `targetFrameRate`.
- [x] **P2.35** Internal `NativeSurface` lease:
  - one per OS surface, never reused;
  - Android takes the window with `ANativeWindow_fromSurface` and releases it with `ANativeWindow_release`; iOS holds the layer strongly;
  - the handle is read once, on the render thread.
- [x] **P2.36** `ViewTarget` state machine with lease-tagged attach and detach. Stale completions are dropped.
- [x] **P2.37** SurfaceView teardown:
  - the revoke flag is set first; the teardown job goes to the front;
  - destroy the SwapChain → `flushAndWait` → `lease.release()` → ack, while main waits;
  - never timeout-and-continue.
- [x] **P2.38** TextureView: `onSurfaceTextureDestroyed` returns false, and the lease is released asynchronously after destroy plus `flushAndWait`.
- [ ] **P2.39** iOS:
  - resize from `layoutSubviews` (bounds × scale) with no fence waits;
  - the display link pauses in the background;
  - removing the layer detaches.
- [ ] **P2.40** `prepareForRecycle()` detaches, and `onDropView()` disposes.

**Slice objects and integrations** (§5.5, §7.1, §7.2)
- [x] **P2.41** Core objects:
  - `FilamentFactory` (`filamentVersion`, `supportedBackends`, `createEngine`);
  - a minimal `Engine`, `Scene`, `View` and `Camera`;
  - async `loadModel`, `Model`, `ModelInstance`, `Animator` and `AnimationPlayer`.
- [x] **P2.42** `TransformBinding` and `ValueBinding`:
  - `createTransformBinding` validates on the render thread;
  - `set*` works from any thread, through a mutex latest-value slot plus a dirty flag, and wakes the thread.
- [x] **P2.43** Reanimated binding helpers:
  - `scheduleOnUI` plus `sv.addListener` on the UI runtime, removed on unmount;
  - Reanimated stays optional, loaded through a lazy module proxy.
- [x] **P2.44** `CameraManipulator` command queue per §7.2:
  - two preallocated 256-entry buffers swapped at frame start; FIFO order;
  - coalescing rules and grab sessions;
  - `reservedEnd` admission and `FilamentQueueFullError`;
  - an implicit end when a new grab begins, in one critical section;
  - commands discarded after dispose; `getLookAt()`.
- [x] **P2.45** `useOrbitGestures`: pan → grab, pinch → scroll, double tap → `jumpToHome`, using the RNGH builder API.

**Slice verification**
- [ ] **P2.46** Harness suites `engine`, `resources`, `entities`, `render-thread`, `surfaces`, `reanimated` and `gestures`, plus reload, pass on both targets.
- [ ] **P2.47** A/B against v1 for ReanimatedRotation and CameraPan.
- [ ] **P2.48** Scheduler and binding decisions are recorded in the ADRs.
- [ ] **Exit gate:** the slice passes on both targets.

---

## Phase 3: Complete imperative API

Plan §10 Phase 3, §5, §8.2.

**API and data paths**
- [ ] **P3.1** Every spec is reviewed against the api-design rules, follows the §5.3 layout, has complete JSDoc, and is typechecked against the generated code.
- [x] **P3.2** Platform IO through the internal `AssetIO` spec. `AssetSource` is `{ uri }` or an `ArrayBuffer`.
  - iOS: memory-mapped `Data`/`NSData` as an owning `ArrayBuffer`.
  - Android: `FileChannel.map` or an `AssetFileDescriptor` mmap → direct `ByteBuffer` → `ArrayBuffer`. A compressed APK entry gets one streamed read. The docs recommend `noCompress` for `.glb`.
  - http(s): downloaded to a cache file keyed by URL, then mapped.
  - Metro dev URLs are cached per session; Android raw and asset resources are supported.
- [x] **P3.3** User `ArrayBuffer`s:
  - read in place when consumed during the call;
  - one snapshot copy at call time, with bounds and format checks, when consumed after the call returns (D10).
- [x] **P3.4** Textures are decoded on an IO thread, then `Texture::setImage` with a release callback. KTX2 and Basis go through Filament's provider.

**Objects** (§5.4)
- [x] **P3.5** `View`: every option as a typed struct (AO, bloom, TAA with float `upscaling`, `varianceGamma` and `filterWidth`, dynamic resolution, dithering, anti-aliasing), plus `projectWorldToScreen`.
- [x] **P3.6** `TransformManager`.
- [x] **P3.7** `RenderableManager` and `Renderable`:
  - `setAxisAlignedBoundingBox` and `scaleBoundingBox`;
  - `recomputeBoundingBoxes` exposed with its documented limits;
  - planes, background and debug geometry are owned objects.
- [x] **P3.8** `LightManager` and `Light`, with one factory per light type and the kebab-case `'focused-spot'`.
- [x] **P3.9** Instancing and morph targets.
- [x] **P3.10** Material variants, `Material`, and `MaterialInstance` with `setTexture(name, texture, sampler)`.
- [x] **P3.11** `Texture`, `IndirectLight`, `Skybox` and background images.
- [x] **P3.12** Clothing: `attachSkin(skinIndex, target)`, plus the name-mapped retarget, which commits the local-transform transaction first and then calls `setBones()`.
- [x] **P3.13** Picking and snapshots:
  - picking in points with a top-left origin, per view; a tap gesture calls `viewTarget.pick(x, y)` and the result reaches React through `scheduleOnRN` (§7.2);
  - snapshots as a `Snapshot` HybridObject with lazy `toArrayBuffer()` and `saveToFile()`.
- [x] **P3.14** `ViewTarget`: `setScene`, `setCamera`, `setClearOptions`, `width`/`height` from the current lease, and the resize and first-frame listeners (§5.5).
- [x] **P3.15** `Model` and `Camera`:
  - `Model`: `getInstance(i)`, `boundingBox` and `getEntities()` as immutable reads; `createInstance` on the render thread; `getEntityByName` and `getEntityName` (§5.4);
  - `Camera`: `followManipulator`.
- [ ] **P3.16** Memory reporting and resource-graph registration for every object in the §4.7 table, not only the slice's.
- [ ] **P3.17** Values and types:
  - `Mat4` representation as spike F decided;
  - `Float3`, `Float4` and `Quaternion` as tuples; `Aabb` and `Box` as structs; `Entity` as a number;
  - kebab-case string unions;
  - colors are linearized correctly.
- [ ] **P3.18** Investigate v1's shadow-clipping case, and test conservative bounds at extreme skinned and morph poses.

**Recorder and physics**
- [x] **P3.19** `Recorder` rewrite, on its own engine:
  - C++ `Recorder` plus an internal `VideoEncoder` (Swift `AVAssetWriter`; Kotlin `MediaCodec` plus `MediaMuxer`);
  - the §4.4 pumps as spike G decided;
  - presentation timestamps `frameIndex / fps`.
- [x] **P3.20** Physics in the core package:
  - `Physics`, `PhysicsWorld`, `RigidBody` and the `CollisionShape` family;
  - batched collision events, native auto-step and entity binding, fixed step;
  - correct destruction order.

**Examples**
- [x] **P3.21** Imperative ports of all 17 examples as harness scenarios.
- [ ] **Exit gate:** every imperative scenario and every per-object harness suite passes on both targets.

---

## Phase 4: Declarative API and examples

Plan §10 Phase 4, §6, Appendix C.

**Components and hooks**
- [ ] **P4.1** `FilamentScene`:
  - either owns an engine (and calls `shutdown()` on unmount) or borrows one through the `engine` prop;
  - a borrowing scene disposes only what it created and removes its listeners.
- [ ] **P4.2** `FilamentView`:
  - props `transparent`, `renderCallback`, `onFirstFrame`, `targetFrameRate` and the view options;
  - several views can share one engine.
- [ ] **P4.3** `Camera`:
  - `Float3` or `SharedValue<Float3>` for position, target and up;
  - aspect ratio from resize events;
  - takes a `manipulator`.
- [ ] **P4.4** `Model`, `ModelRenderer`, `ModelInstance` and `Animator`:
  - backed by native objects and `AnimationPlayer`;
  - transform props accept SharedValues;
  - `onPress` uses per-view picking.
- [ ] **P4.5** `Light`, `DefaultLight`, `EnvironmentalLight`, `Skybox`, `BackgroundImage`, `DebugBox` and `EntitySelector`: owned and disposed on unmount; numeric props accept SharedValues.
- [ ] **P4.6** `useFilamentContext` returns `{ engine, scene, view, camera, transformManager, renderableManager, lightManager }`.
- [ ] **P4.7** Kept hooks, rebuilt on Promises and `dispose()`: `useModel`, `useAnimator`, `useCameraManipulator`, `useSkybox`, `useLightEntity`, `useEntityInScene`, `useRecorder`, `useRecorderRenderLoop`, `useConfigureAssetShadow`, `useDisposableResource`.
- [ ] **P4.8** `useRenderThreadEffect`, `useRenderThreadCallback` and `useRenderThreadMemo`, with stale-result guards.
- [ ] **P4.9** New: `useFrameCallback`, `useOrbitGestures`, `useAnimationPlayer`, `useTransformBinding` and `useValueBinding`.
- [ ] **P4.10** Removed: `useBuffer`, `useSyncSharedValue`, `useDerivedValue`, `useWorkletEffect`, `useWorkletCallback`, `useWorkletMemo` and `withCleanupScope`.
- [ ] **P4.11** SharedValue props for:
  - transforms; camera position, target and up;
  - light intensity, color and direction;
  - material float and color parameters;
  - animation index, time and weight; morph weights.
- [ ] **P4.12** React rules:
  - StrictMode-safe;
  - whoever creates a native object disposes it;
  - one `runOnRenderThread` job per commit;
  - no timers, no `InteractionManager`, no module-level mutable tables.

**Examples and docs**
- [ ] **P4.13** All 17 examples ported in both apps with identical visible behaviour.
- [ ] **P4.14** New coverage examples: clothing through `attachSkin`, several views in a scrolling list, and `useOrbitGestures`.
- [ ] **P4.15** Docs:
  - architecture and threading pages;
  - updated guides;
  - TypeDoc API reference;
  - a migration guide with a before/after snippet for every removed v1 API (Appendix C).
- [ ] **Exit gate:** the full example verification matrix is green on both targets.

---

## Phase 5: Skia and WebGPU

Plan §10 Phase 5, §7.3, §7.4. Starts only for the rows spike G marked supported.

- [ ] **P5.1** Only the supported directions and backends are implemented. Everything else rejects with a clear error and never falls back to a CPU copy.
- [ ] **P5.2** The GPU-completion signal per backend is used as spike G proved: the frame-completed callback on Metal, an exported `Sync` fence on OpenGL and Vulkan.
- [ ] **P5.3** Examples, where supported: a Skia overlay on a 3D scene, a Skia texture on a model, and WebGPU post-processing.
- [ ] **P5.4** The `interop` harness suite passes: Filament → WebGPU readback pixel check, and a Skia image from a Filament target.
- [ ] **Exit gate:** the supported interop examples pass on both targets with no CPU copies, verified by allocation counters and traces.

---

## Phase 6: Hardening and release

Plan §10 Phase 6, §11.7.

- [ ] **P6.1** A/B benchmarks against the v1 baseline, regressions fixed, and the size report produced.
- [ ] **P6.2** Soak and stress runs and leak sweeps. ASan/UBSan builds on the phone and the simulator; TSan on the simulator.
- [ ] **P6.3** Release pipeline: `release-it` plus npm publish, sources only. `2.0.0-beta.x`, then `rc`, then stable.
- [ ] **P6.4** Release notes document the tested configuration: the phone's details, both Filament backends, and the iOS simulator.
- [ ] **Exit gate:** every release gate below is green.

---

## Test infrastructure

Built alongside Phases 0–2 (§11.1, §11.2).

**Runners and scripts**
- [ ] **T.1** `examples/AppExampleFabric/rn-harness.config.mjs` defines two runners:
  - `androidPlatform` with `physicalAndroidDevice('<manufacturer>', '<model>')`;
  - `applePlatform` with `appleSimulator('iPhone 17 Pro', '26.0')`.
- [ ] **T.2** Entry points `test:android`, `test:ios`, `e2e:android`, `e2e:ios`, `bench:android`, `bench:ios` and `verify:android`:
  - each writes a report to `reports/<target>/<date>/`;
  - Android scripts fail fast unless exactly one device is listed by `adb devices`;
  - every report records the phone's model, Android version, SoC/GPU, RAM, refresh rate and thermal status.
- [ ] **T.3** Every Android suite runs on both backends (`opengl`, `vulkan`). arm64-v8a always; the armeabi-v7a build is smoke-tested if the phone runs 32-bit apps.
- [ ] **T.4** iOS API suites also run on an older installed runtime (≥ 15.1), if one exists.
- [ ] **T.5** Maestro flows for every example.

**Goldens and traces**
- [ ] **T.6** Golden tooling:
  - `takeSnapshot()` images plus composited captures (`adb exec-out screencap -p`, `xcrun simctl io booted screenshot`);
  - pulled from the device or the app container;
  - compared with an SSIM/pixel-diff threshold, per target and per backend;
  - deterministic states (fixed camera, `seek`, TAA jitter and temporal dithering off);
  - goldens change only through an explicit, reviewed command.
- [ ] **T.7** Trace sections `RNF::frame`, `RNF::jobs`, `RNF::listeners` and `RNF::render` in Perfetto, with matching `os_signpost` intervals on iOS.

**Benchmarks**
- [ ] **T.8** Benchmark harness:
  - 10 s warm-up, then 60 s of measurement;
  - at least five alternating v1/v2 runs in randomized order, with a thermal cool-down between runs;
  - medians with bootstrap 95% confidence intervals;
  - SurfaceFlinger per-layer present-time parsing;
  - automatic evaluation of the §11.5 gate.
- [ ] **T.9** Synthetic scenes: static, 50 animated instances, 200 physics bodies, each with a fixed camera path.

**Builds and CI**
- [ ] **T.10** Debug counters for render-thread allocations per frame and live objects per type.
- [ ] **T.11** Sanitizer builds: ASan and UBSan on both targets, TSan on the simulator.
- [ ] **T.12** Alignment check: `zipalign -c -P 16 -v 4` and `check_elf_alignment.sh` on the APK.
- [ ] **T.13** CI workflows:
  - every PR on GitHub-hosted runners;
  - weekly soak, stress and sanitizer runs;
  - the release pipeline;
  - an optional self-hosted `android-device` runner (§14.4).

---

## Harness suites

Plan §11.3. Tick a suite when it passes on the phone (both backends) and on the simulator.

- [ ] `engine`
- [ ] `resources`
- [ ] `entities`
- [ ] `render-thread`
- [ ] `scene-sharing`
- [ ] `buffers`
- [ ] `surfaces`
- [ ] `assets`
- [ ] `scene`
- [ ] `transform`
- [ ] `renderable`
- [ ] `light`
- [ ] `material`
- [ ] `texture`
- [ ] `animation`
- [ ] `bounds`
- [ ] `morph`
- [ ] `picking`
- [ ] `snapshot`
- [ ] `recorder`
- [ ] `reanimated`
- [ ] `gestures`
- [ ] `physics`
- [ ] `interop` (only after spike G)

---

## Example verification matrix

Plan §11.4. Each cell means the standard protocol passes on that target:
- P1 first frame within budget;
- P2 both kinds of golden;
- P3 the example-specific script;
- P4 lifecycle;
- P5 performance capture;
- P6 object counters back to baseline;
- P7 log hygiene;
- P8 release build.

The example-specific checks and performance focus for each row are in plan §11.4.

| # | Example | Imperative scenario | CLI port | Expo port | Phone OpenGL | Phone Vulkan | iOS simulator | Release (P8) |
|---|---|---|---|---|---|---|---|---|
| 1 | Animation Transitions | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| 2 | Camera Pan | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| 3 | Offscreen recording | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| 4 | Image | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| 5 | Load from file | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| 6 | None Transparent | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| 7 | Multiple Instances | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| 8 | Animated Rotate | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| 9 | Animated Rotate with Shared Values | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| 10 | Reanimated Rotate | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| 11 | Physics Coin | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| 12 | Fade Out | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| 13 | Cast Shadow | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| 14 | Scale Effect | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| 15 | Change Materials | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| 16 | Skybox | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| 17 | Morph Targets | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| – | Test (hidden) | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| N1 | Clothing via `attachSkin` | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| N2 | Views in a scrolling list | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| N3 | `useOrbitGestures` | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |

Rows 9, 12 and 14 change how the example is built (render-thread state and Reanimated bindings). Their check is that the visible behaviour matches v1. The interop examples join this table only if spike G marks them supported.

---

## Stress, lifecycle and races

Plan §11.6. All run on both targets unless the item names one.

- [ ] **S.1** Mount/unmount `FilamentScene` ×200 and JS reload ×50 in debug. Thread count and memory return to baseline.
- [ ] **S.2** A 30-minute soak of Animation Transitions with continuous cross-fades. Memory slope ≈ 0 and no frame-time drift.
- [ ] **S.3** Background/foreground ×100 on the phone, with SurfaceView and with TextureView. No ANR, no stale lease attached, no use of a released surface.
- [ ] **S.4** Dispose owners while queued jobs, loads, picks and snapshots are in flight; dispose from a second runtime.
- [ ] **S.5** 10,000 gesture commands per frame from two producers, with disposal during enqueue.
- [ ] **S.6** Low-memory signals (`onTrimMemory`, the iOS memory warning) release caches without breaking rendering.
- [ ] **S.7** A `FlatList` of 20 `FilamentView`s on one shared engine, scrolled for 60 s. Recycling works, offscreen targets pause, and the phone stays within the missed-deadline gate.
- [ ] **S.8** Rotation and multi-window/split-screen on the phone; Split View resizing on an iPad simulator.
- [ ] **S.9** Two scenes on one shared engine: mount and unmount one ×50 while the other keeps rendering.
- [ ] **S.10** Binary acquisition: concurrent builds and `pod install`s, interrupted downloads and extractions, offline builds with a warm store.

---

## Budgets and performance targets

Plan §8.1 and §11.5. Every budget is verified by a test or a trace; link the evidence.

**Budgets (§8.1)**
- [ ] **BG.1** Static or native-only scenes: zero JS executions per frame on every runtime.
- [ ] **BG.2** A Reanimated animation driving a binding: one UI-runtime listener call per update, and zero RNF-caused JS on the RN and render runtimes.
- [ ] **BG.3** Zero heap allocations in steady-state render-thread frame work (debug counter).
- [ ] **BG.4** Per-frame locks are limited to binding slots and controller queues. Runtime-mutex contention is measured (spike D).
- [ ] **BG.5** One thread transition per ownership boundary.
- [ ] **BG.6** Asset bytes never enter JS unless the caller supplied them.
- [ ] **BG.7** RNF waits across threads only in three places:
  - SurfaceView teardown;
  - the shutdown join;
  - the final Android recording flush.
- [ ] **BG.8** Binding latency as gated in §7.1.

**Targets on the phone (§11.5).** They are hypotheses until the Phase 0 baseline confirms them, and the baseline can only make them stricter.
- [ ] **BG.9** No UI-thread time attributable to RNF per frame, except listener cost while bindings or gestures are active.
- [ ] **BG.10** Render-thread CPU per frame is not worse than v1 anywhere. Hypothesis: at least 20% lower for Animator, Camera, AnimatedRotate, ReanimatedRotation and PhysicsCoin.
- [ ] **BG.11** Missed deadlines over 60 s on single-model scenes are at most the baseline. Hypothesis: zero.
- [ ] **BG.12** Time to first frame, load time and peak load memory are not worse than v1. No copies proportional to file size beyond Filament internals.
- [ ] **BG.13** The npm package holds sources and generated code only (v1: 343 MB).
- [ ] **BG.14** The regression gate holds:
  - time metrics: the 95% interval of v2 − v1 excludes zero and the median is worse by more than 3% → regression;
  - missed deadlines: more than one extra per 60 s run → regression;
  - only CPU time is gated on the simulator.

---

## Workarounds removed

Plan §9. Tick a row when the v1 code is gone and its replacement is tested.

- [ ] **W.1** `InteractionManager` plus `setTimeout(0)` before `release()` → FIFO queue and resource graph.
- [ ] **W.2** Busy-wait texture decode → async decode with completion callbacks.
- [ ] **W.3** `FENCE_WAIT_FOR_EVER` on every resize → size published to the target.
- [ ] **W.4** `flushAndWait` in every swapchain deleter → only in surface teardown.
- [ ] **W.5** Recorder `while` loops → readiness callbacks and backpressure.
- [ ] **W.6** Per-frame surface validity checks and the double `onSurfaceCreated` → leases and the `ViewTarget` state machine.
- [x] **W.7** Per-frame aspect-ratio polling → resize listener.
- [ ] **W.8** Touching `Worklets.defaultContext` to force initialisation → removed.
- [ ] **W.9** worklets-core patch-package → removed.
- [ ] **W.10** Three Filament source patches → upstream fixes and public APIs.
- [ ] **W.11** Private `VirtualMachineEnv.h` copy and its `JNI_OnLoad` call → dropped.
- [ ] **W.12** PhysicsCoin skipping frames while `passedSeconds <= 1` → correct `FrameInfo` and fixed step.
- [ ] **W.13** Global touch-handler table → per-view picking.
- [ ] **W.14** Avoiding `in` on host objects → Nitro prototypes.
- [ ] **W.15** `Promise.resolve(syncCall)` adapters → sync/async split designed into the API.
- [ ] **W.16** A detached `std::thread` per Promise → Nitro `Promise` and `Dispatcher`.
- [ ] **W.17** Platform-specific inline-vs-post dispatching → one `RenderThread` semantics on both platforms.

---

## v1 defects closed

Plan Appendix B. Tick a defect when its regression test exists and passes on both targets.

- [ ] **V.1** Filament called from the JS thread while rendering
- [ ] **V.2** JNI global refs never released
- [ ] **V.3** `JDispatcher` runs jobs under its mutex; broken `runSync`
- [ ] **V.4** `Choreographer.stop()` then start yields two callbacks per vsync
- [ ] **V.5** TextureView surface released before the swapchain is destroyed
- [ ] **V.6** `ListenerManager` uses an erased iterator
- [ ] **V.7** Bullet world destruction use-after-free
- [ ] **V.8** Leaked IndirectLight, cubemaps, textures, planes, background, debug cubes and lights
- [ ] **V.9** Dangling raw pointers in the `MaterialInstance`, `FilamentInstance` and `Animator` wrappers
- [ ] **V.10** `createPlane` reuses the first call's extents through a `static`
- [ ] **V.11** Variable-length array in `loadInstancedAsset`
- [ ] **V.12** Busy-wait texture loader
- [ ] **V.13** Unbounded fence wait on resize
- [ ] **V.14** Recorder loops, per-frame `memcpy`, leaked pixel buffer, uninitialized window
- [ ] **V.15** A detached thread per Promise
- [ ] **V.16** Unchecked argument count; DEBUG-only type checks
- [ ] **V.17** Android logger format-string bug
- [ ] **V.18** `focused_sport` typo and TS/native mismatches
- [ ] **V.19** TAA `upscaling` and `varianceGamma` mis-mapped; wrong jitter message
- [ ] **V.20** `hexColorToSRGBLinear` does not linearize
- [ ] **V.21** `FrameInfo` first-frame delta and paused time
- [ ] **V.22** A render-callback exception is fatal in release builds
- [ ] **V.23** Global touch-handler table
- [ ] **V.24** New threads on every reload
- [ ] **V.25** Asset IO copies and synchronous downloads
- [ ] **V.26** Camera manipulator data race
- [ ] **V.27** Camera and skybox deleter order and thread
- [ ] **V.28** A whole frame inside an `@FastNative` call
- [ ] **V.29** Clothing sync inside an open transform transaction; per-frame map copies

---

## Removals

Plan §4.2. Each item is removed only when its replacement's tests pass.

- [x] **R.1** `filament` and `bullet3` submodules.
- [x] **R.2** `package/scripts/build-filament.sh`, `setup-filament-quick.sh` and `build-bullet3.sh`.
- [x] **R.3** The three Filament patches and `patches/react-native-worklets-core+1.6.2.patch`.
- [x] **R.4** The copied private header `VirtualMachineEnv.h`.
- [x] **R.5** `codegenConfig`, the TurboModule installer, and the Paper code (`package/android/src/oldarch`, `RNFFilamentViewManager.mm`).
- [x] **R.6** `package/cpp/jsi/`, `package/cpp/threading/`, `RNFListener*`, `RNFManagedBuffer.h`, `RNFFilamentBuffer.h`, the platform dispatchers and the managed buffers.
- [x] **R.7** `package/cpp/test`.
- [x] **R.8** v1's Java `HandlerThread`, `Choreographer` and fbjni dispatcher files on Android.

---

## Release gates and definition of done

Plan §11.7 and §11.8.

- [ ] **DD.1** All 17 examples and the hidden Test screen pass the §11.4 protocol:
  - on the phone with both backends, and on the simulator;
  - in debug and release.
- [ ] **DD.2** Every §8.1 budget is verified by a test or a trace.
- [ ] **DD.3** No §9 workaround remains, and the banned-pattern grep is clean.
- [ ] **DD.4** The §11.5 gate passes, or an exception is written down and accepted.
- [ ] **DD.5** Every Appendix B defect has a regression test.
- [ ] **DD.6** Docs are published: architecture, threading, guides, API reference and the migration guide.
- [ ] **DD.7** Release run: the complete §11.7 pipeline on both targets, the manual dogfood checklist signed off on the phone and the simulator, and the size report.

---

## Open decisions

Plan §14. The plan assumes these defaults until the user says otherwise. Tick when confirmed or changed.

- [ ] **O.1** Minimum React Native: `>=0.83.0 <0.84.0`.
- [ ] **O.2** Default view transparency: opaque.
- [ ] **O.3** Commit generated nitrogen code: yes.
- [ ] **O.4** Self-hosted runner for the phone: no.
- [ ] **O.5** iOS binary acquisition: fetch during `pod install`.

---

## Plan errata

Found while writing this checklist.

- [x] **ER.1** §12 said `registerRawHybridMethod` is used for "the two worklets touchpoints"; §5.2 and D13 define three. Fixed in revision 6.
