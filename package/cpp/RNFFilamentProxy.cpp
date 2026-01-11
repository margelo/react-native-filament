//
// Created by Marc Rousavy on 20.02.24.
//

#include "RNFFilamentProxy.h"
#include <jsi/jsi.h>

#include "RNFReferences.h"
#include "core/RNFEngineBackendEnum.h"
#include "core/RNFEngineConfigHelper.h"
#include "jsi/RNFPromise.h"
#include "threading/RNFDispatcher.h"
#include "threading/RNFAsyncQueueImpl.h"

#include <memory>
#include <string>
#include <utility>
#include <vector>

namespace margelo {

using namespace facebook;

void FilamentProxy::loadHybridMethods() {
  registerHybridMethod("loadAsset", &FilamentProxy::loadAssetAsync, this);
  registerHybridMethod("findFilamentView", &FilamentProxy::findFilamentViewAsync, this);
  registerHybridMethod("createTestObject", &FilamentProxy::createTestObject, this);
  registerHybridMethod("createEngine", &FilamentProxy::createEngine, this);
  registerHybridMethod("createBullet", &FilamentProxy::createBullet, this);
  registerHybridMethod("createChoreographer", &FilamentProxy::createChoreographerWrapper, this);
  registerHybridMethod("createRecorder", &FilamentProxy::createRecorder, this);
  registerHybridMethod("getCurrentDispatcher", &FilamentProxy::getCurrentDispatcher, this);
  registerHybridGetter("hasWorklets", &FilamentProxy::getHasWorklets, this);
#if HAS_WORKLETS
  registerHybridMethod("createWorkletContext", &FilamentProxy::createWorkletContext, this);
  registerHybridMethod("createWorkletAsyncQueue", &FilamentProxy::createWorkletAsyncQueue, this);
#endif
}

bool FilamentProxy::getHasWorklets() {
#if HAS_WORKLETS
  return true;
#else
  return false;
#endif
}

#if HAS_WORKLETS
std::shared_ptr<RNWorklet::JsiWorkletContext> FilamentProxy::createWorkletContext() {
  Logger::log(TAG, "Creating Worklet Context...");
  auto jsDispatcher = getJSDispatcher();
  auto runOnJS = [=](std::function<void()>&& function) { jsDispatcher->runAsync(std::move(function)); };
  auto renderThreadDispatcher = getRenderThreadDispatcher();
  auto runOnWorklet = [=](std::function<void()>&& function) { renderThreadDispatcher->runAsync(std::move(function)); };
  auto& runtime = getMainJSRuntime();
  auto workletContext = std::make_shared<RNWorklet::JsiWorkletContext>("FilamentRenderer", &runtime, runOnJS, runOnWorklet);
  Logger::log(TAG, "Successfully created WorkletContext! Installing global Dispatcher...");

  workletContext->invokeOnWorkletThread([=](RNWorklet::JsiWorkletContext*, jsi::Runtime& runtime) {
    Dispatcher::installRuntimeGlobalDispatcher(runtime, renderThreadDispatcher);
    Logger::log(TAG, "Successfully installed global Dispatcher in WorkletContext!");
  });

  return workletContext;
}

std::shared_ptr<worklets::AsyncQueue> FilamentProxy::createWorkletAsyncQueue() {
    Logger::log(TAG, "Creating Worklet AsyncQueue...");
    auto renderThreadDispatcher = getRenderThreadDispatcher();
    auto runOnWorklet = [=](std::function<void()>&& function) { renderThreadDispatcher->runAsync(std::move(function)); };
    // TODO: i am pretty sure i should hold this dispatcher somewhere?
    return std::make_shared<RNFAsyncQueueImpl>(renderThreadDispatcher);
}
#endif

jsi::Value FilamentProxy::getCurrentDispatcher(jsi::Runtime& runtime, const jsi::Value&, const jsi::Value*, size_t) {
  return Dispatcher::getRuntimeGlobalDispatcherHolder(runtime);
}

std::future<std::shared_ptr<FilamentBuffer>> FilamentProxy::loadAssetAsync(const std::string& path) {
  Logger::log(TAG, "Loading asset %s...", path.c_str());
  auto weakThis = std::weak_ptr<FilamentProxy>(shared<FilamentProxy>());
  auto dispatcher = getBackgroundDispatcher();
  return dispatcher->runAsyncAwaitable<std::shared_ptr<FilamentBuffer>>([weakThis, path]() {
    auto sharedThis = weakThis.lock();
    if (sharedThis != nullptr) {
      return sharedThis->loadAsset(path);
    } else {
      throw std::runtime_error("Failed to load asset, FilamentProxy has already been destroyed!");
    }
  });
}

std::future<std::shared_ptr<FilamentView>> FilamentProxy::findFilamentViewAsync(int id) {
  Logger::log(TAG, "Finding FilamentView #%i...", id);
  auto weakThis = std::weak_ptr<FilamentProxy>(shared<FilamentProxy>());
  auto dispatcher = getUIDispatcher();
  return dispatcher->runAsyncAwaitable<std::shared_ptr<FilamentView>>([weakThis, id]() {
    auto sharedThis = weakThis.lock();
    if (sharedThis != nullptr) {
      return sharedThis->findFilamentView(id);
    } else {
      throw std::runtime_error("Failed to find Filament View, FilamentProxy has already been destroyed!");
    }
  });
}

std::shared_ptr<TestHybridObject> FilamentProxy::createTestObject() {
  Logger::log(TAG, "Creating TestObject...");
  return std::make_shared<TestHybridObject>();
}

std::shared_ptr<EngineWrapper> FilamentProxy::createEngine(std::optional<std::string> backend,
                                                           std::optional<std::unordered_map<std::string, int>> arguments) {
  Logger::log(TAG, "Creating Engine...");

  std::shared_ptr<Dispatcher> renderThread = getRenderThreadDispatcher();

  Engine::Config config = EngineConfigHelper::makeConfigFromUserParams(arguments);
  Engine::Backend backendEnum = Engine::Backend::DEFAULT;
  if (backend.has_value()) {
    EnumMapper::convertJSUnionToEnum(backend.value(), &backendEnum);
  }

  // Create the actual filament engine:
  std::shared_ptr<Engine> engine =
      References<Engine>::adoptRef(Engine::Builder().backend(backendEnum).config(&config).build(), [renderThread](Engine* engine) {
        // Make sure that the engine gets destroyed on the thread that it was created on.
        // It can happen that the engine gets cleaned up by Hades (hermes GC) on a different thread.
        renderThread->runAsync([engine]() {
          Logger::log(TAG, "Destroying engine...");
          Engine::destroy(engine);
        });
      });

  // Get screen refresh rate
  float refreshRate = getDisplayRefreshRate();
  Logger::log(TAG, "Display refresh rate: %f Hz", refreshRate);

  float densityPixelRatio = getDensityPixelRatio();

  // Create the EngineImpl...
  std::shared_ptr<EngineImpl> engineImpl = std::make_shared<EngineImpl>(renderThread, engine, refreshRate, densityPixelRatio);

  return std::make_shared<EngineWrapper>(engineImpl);
}

std::shared_ptr<BulletWrapper> FilamentProxy::createBullet() {
  Logger::log(TAG, "Creating Bullet...");
  return std::make_shared<BulletWrapper>();
}

jsi::Value FilamentProxy::createChoreographerWrapper(jsi::Runtime& runtime, const jsi::Value&, const jsi::Value*, size_t) {

  Logger::log(TAG, "Creating Choreographer...");
  std::shared_ptr<Choreographer> choreographer = createChoreographer();

  ChoreographerWrapper* choreographerWrapperPtr = new ChoreographerWrapper(choreographer);

  RuntimeLifecycleMonitor::addListener(runtime, choreographerWrapperPtr);

  // Wrap the ChoreographerWrapper in a shared_ptr with a custom deleter that removes the listener from the RuntimeLifecycleMonitor:
  std::shared_ptr<ChoreographerWrapper> choreographerWrapper =
      std::shared_ptr<ChoreographerWrapper>(choreographerWrapperPtr, [&runtime](ChoreographerWrapper* ptr) {
        // Remove the ChoreographerWrapper from the RuntimeLifecycleMonitor when it gets destroyed.
        RuntimeLifecycleMonitor::removeListener(runtime, ptr);
        delete ptr;
      });

  return JSIConverter<std::shared_ptr<ChoreographerWrapper>>::toJSI(runtime, choreographerWrapper);
}

} // namespace margelo
