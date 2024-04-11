//
// Created by Marc Rousavy on 20.02.24.
//

#pragma once

#include <jsi/jsi.h>

#include <future>
#include <string>
#include <vector>

#include "Choreographer.h"
#include "FilamentBuffer.h"
#include "FilamentView.h"
#include "bullet/BulletWrapper.h"
#include "core/EngineWrapper.h"
#include "jsi/HybridObject.h"
#include "test/TestHybridObject.h"
#include "threading/Dispatcher.h"

#include <ReactCommon/CallInvoker.h>
#include <jsi/jsi.h>

#ifdef HAS_WORKLETS
#include <react-native-worklets-core/WKTJsiWorkletContext.h>
#endif

namespace margelo {

using namespace facebook;

class FilamentProxy : public HybridObject {
public:
  explicit FilamentProxy() : HybridObject("FilamentProxy") {}

private:
  // Platform-specific implementations
  virtual std::shared_ptr<FilamentBuffer> loadAsset(const std::string& path) = 0;
  virtual std::shared_ptr<FilamentView> findFilamentView(int id) = 0;
  virtual std::shared_ptr<Choreographer> createChoreographer() = 0;
  /**
   * Get the Dispatcher that is responsible for rendering to Filament.
   * This is guaranteed to only use a single Thread, as opposed to a Thread-pool.
   */
  virtual const std::shared_ptr<Dispatcher>& getRenderThreadDispatcher() = 0;
  /**
   * Get the Dispatcher for the platform-default UI Thread.
   * This is guaranteed to only use a single Thread, as opposed to a Thread-pool.
   */
  virtual const std::shared_ptr<Dispatcher>& getUIDispatcher() = 0;
  /**
   * Get a Dispatcher that uses a Thread-pool for background operations such as File I/O.
   * This Dispatcher may use multiple Threads to run code.
   */
  virtual const std::shared_ptr<Dispatcher>& getBackgroundDispatcher() = 0;

  // For testing
  std::shared_ptr<TestHybridObject> createTestObject();

  // Public API
  std::future<std::shared_ptr<FilamentBuffer>> loadAssetAsync(const std::string& path);
  std::future<std::shared_ptr<FilamentView>> findFilamentViewAsync(int id);
  std::shared_ptr<EngineWrapper> createEngine(std::optional<std::string> backend = std::nullopt,
                                              std::optional<std::unordered_map<std::string, ing>> arguments = std::nullopt);
  std::shared_ptr<BulletWrapper> createBullet();
  bool getHasWorklets();

#if HAS_WORKLETS
  const std::shared_ptr<RNWorklet::JsiWorkletContext>& getWorkletContext();
#endif

public:
  virtual jsi::Runtime& getRuntime() = 0;
  virtual const std::shared_ptr<react::CallInvoker>& getCallInvoker() = 0;

private:
  static constexpr auto TAG = "FilamentProxy";

private:
#if HAS_WORKLETS
  std::shared_ptr<RNWorklet::JsiWorkletContext> _workletContext;
#endif

public:
  void loadHybridMethods() override;
};

} // namespace margelo
