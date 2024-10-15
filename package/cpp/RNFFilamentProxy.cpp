//
// Created by Marc Rousavy on 20.02.24.
//

#include "RNFFilamentProxy.h"
#include <jsi/jsi.h>

#include "RNFReferences.h"
#include "core/RNFEngineBackendEnum.h"
#include "core/RNFEngineConfigHelper.h"

#include <memory>
#include <string>
#include <utility>
#include <vector>

namespace margelo {

using namespace facebook;

void FilamentProxy::loadHybridMethods() {
  HybridObject::loadHybridMethods();
  registerHybrids(this, [](nitro::Prototype& proto) {
    proto.registerHybridMethod("loadAsset", &FilamentProxy::loadAssetAsync);
    proto.registerHybridMethod("findFilamentView", &FilamentProxy::findFilamentViewAsync);
    proto.registerHybridMethod("createEngine", &FilamentProxy::createEngine);
    proto.registerHybridMethod("createBullet", &FilamentProxy::createBullet);
    proto.registerRawHybridMethod("createChoreographer", 0, &FilamentProxy::createChoreographerWrapper);
    proto.registerHybridMethod("createRecorder", &FilamentProxy::createRecorder);
    proto.registerRawHybridMethod("getCurrentDispatcher", 0, &FilamentProxy::getCurrentDispatcher);
    proto.registerHybridGetter("hasWorklets", &FilamentProxy::getHasWorklets);
  #if HAS_WORKLETS
    proto.registerHybridMethod("createWorkletContext", &FilamentProxy::createWorkletContext);
  #endif
  });
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
    nitro::Dispatcher::installRuntimeGlobalDispatcher(runtime, renderThreadDispatcher);
    Logger::log(TAG, "Successfully installed global Dispatcher in WorkletContext!");
  });

  return workletContext;
}
#endif

// TODO: nitro is this still needed?!
jsi::Value FilamentProxy::getCurrentDispatcher(jsi::Runtime& runtime, const jsi::Value&, const jsi::Value*, size_t) {
#ifdef NITRO_DEBUG
  if (!runtime.global().hasProperty(runtime, "__nitroDispatcher")) [[unlikely]] {
    throw std::runtime_error("Failed to get current Dispatcher - the global Dispatcher "
                             "holder (global.__nitroDispatcher) "
                             "does not exist! Was Dispatcher::installDispatcherIntoRuntime() called "
                             "for this jsi::Runtime?");
  }
#endif
  return runtime.global().getProperty(runtime, "__nitroDispatcher");
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

std::shared_ptr<EngineWrapper> FilamentProxy::createEngine(std::optional<std::string> backend,
                                                           std::optional<std::unordered_map<std::string, int>> arguments) {
  Logger::log(TAG, "Creating Engine...");

  std::shared_ptr<nitro::Dispatcher> renderThread = getRenderThreadDispatcher();

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

  std::shared_ptr<ChoreographerWrapper> choreographerWrapper = std::make_shared<ChoreographerWrapper>(choreographer);

  return nitro::JSIConverter<std::shared_ptr<ChoreographerWrapper>>::toJSI(runtime, choreographerWrapper);
}

} // namespace margelo
