//
// Created by Marc Rousavy on 20.02.24.
//

#pragma once

#include <jsi/jsi.h>

#include <future>
#include <string>
#include <vector>

#include "RNFChoreographer.h"
#include "RNFChoreographerWrapper.h"
#include "RNFFilamentBuffer.h"
#include "RNFFilamentRecorder.h"
#include "RNFFilamentView.h"
#include "bullet/RNFBulletWrapper.h"
#include "core/RNFEngineWrapper.h"
#include "jsi/RNFHybridObject.h"
#include "test/RNFTestHybridObject.h"
#include "threading/RNFDispatcher.h"

#include <ReactCommon/CallInvoker.h>

#if HAS_WORKLETS
#include <worklets/RunLoop/AsyncQueue.h>
#endif

namespace margelo {

using namespace facebook;

class FilamentProxy : public HybridObject {
public:
  explicit FilamentProxy() : HybridObject(TAG) {}

private:
  // Platform-specific implementations
  virtual std::shared_ptr<FilamentBuffer> loadAsset(const std::string& path) = 0;
  virtual std::shared_ptr<FilamentView> findFilamentView(int id) = 0;
  virtual std::shared_ptr<Choreographer> createChoreographer() = 0;
  virtual std::shared_ptr<FilamentRecorder> createRecorder(int width, int height, int fps, double bitRate) = 0;

  /**
   * Get the Dispatcher for the main react JS thread.
   */
  virtual std::shared_ptr<Dispatcher> getJSDispatcher() = 0;
  /**
   * Get the Dispatcher that is responsible for rendering to Filament.
   * This is guaranteed to only use a single Thread, as opposed to a Thread-pool.
   */
  virtual std::shared_ptr<Dispatcher> getRenderThreadDispatcher() = 0;
  /**
   * Get the Dispatcher for the platform-default UI Thread.
   * This is guaranteed to only use a single Thread, as opposed to a Thread-pool.
   */
  virtual std::shared_ptr<Dispatcher> getUIDispatcher() = 0;
  /**
   * Get a Dispatcher that uses a Thread-pool for background operations such as File I/O.
   * This Dispatcher may use multiple Threads to run code.
   */
  virtual std::shared_ptr<Dispatcher> getBackgroundDispatcher() = 0;
  /**
   * Get the refresh rate of the display in Hz.
   * Needed for correct frame pacing and dynamic resolution calculations.
   */
  virtual float getDisplayRefreshRate() = 0;
  /**
   * Get the density pixel ratio (DP) of the display.
   */
  virtual float getDensityPixelRatio() = 0;

  jsi::Value getCurrentDispatcher(jsi::Runtime& runtime, const jsi::Value& thisValue, const jsi::Value* args, size_t count);

  // For testing
  std::shared_ptr<TestHybridObject> createTestObject();

  // Public API
  std::future<std::shared_ptr<FilamentBuffer>> loadAssetAsync(const std::string& path);
  std::future<std::shared_ptr<FilamentView>> findFilamentViewAsync(int id);
  std::shared_ptr<EngineWrapper> createEngine(std::optional<std::string> backend = std::nullopt,
                                              std::optional<std::unordered_map<std::string, int>> arguments = std::nullopt);
  std::shared_ptr<BulletWrapper> createBullet();
  bool getHasWorklets();
  jsi::Value createChoreographerWrapper(jsi::Runtime& runtime, const jsi::Value& thisValue, const jsi::Value* args, size_t count);

#if HAS_WORKLETS
  /**
   * Creates the queue the Filament worklet runtime drains its jobs from.
   * Every job runs on the Filament render thread. Pass it as `queue` to `createWorkletRuntime`.
   */
  std::shared_ptr<worklets::AsyncQueue> createWorkletAsyncQueue();
  /**
   * Installs the render thread dispatcher as the global dispatcher of the runtime this is called from.
   * Call it from the worklet runtime's `initializer`.
   */
  jsi::Value installDispatcher(jsi::Runtime& runtime, const jsi::Value& thisValue, const jsi::Value* args, size_t count);
#endif

public:
  // Expected to return the runtime the FilamentProxy has been created on, which is the main JS runtime.
  virtual jsi::Runtime& getMainJSRuntime() = 0;

private:
  static constexpr auto TAG = "FilamentProxy";

public:
  void loadHybridMethods() override;
};

} // namespace margelo
