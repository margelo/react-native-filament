//
// Created by Marc Rousavy on 20.02.24.
//

#include "FilamentProxy.h"
#include <jsi/jsi.h>

#include "core/EngineBackendEnum.h"
#include "core/EngineConfigHelper.h"
#include "jsi/Promise.h"
#include "threading/WorkletContextDispatcher.h"

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
  registerHybridGetter("hasWorklets", &FilamentProxy::getHasWorklets, this);
#if HAS_WORKLETS
  registerHybridMethod("getWorkletContext", &FilamentProxy::getWorkletContext, this);
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
const std::shared_ptr<RNWorklet::JsiWorkletContext>& FilamentProxy::getWorkletContext() {
  if (_workletContext == nullptr) {
    Logger::log(TAG, "Creating Worklet Context...");
    auto callInvoker = getCallInvoker();
    auto runOnJS = [=](std::function<void()>&& function) { callInvoker->invokeAsync(std::move(function)); };
    auto renderThreadDispatcher = getRenderThreadDispatcher();
    auto runOnWorklet = [=](std::function<void()>&& function) { renderThreadDispatcher->runAsync(std::move(function)); };
    auto& runtime = getRuntime();
    _workletContext = std::make_shared<RNWorklet::JsiWorkletContext>("FilamentRenderer", &runtime, runOnJS, runOnWorklet);
    Logger::log(TAG, "Successfully created WorkletContext! Installing global Dispatcher...");

    _workletContext->invokeOnWorkletThread([=](RNWorklet::JsiWorkletContext*, jsi::Runtime& runtime) {
      PromiseFactory::install(runtime, renderThreadDispatcher);
      Logger::log(TAG, "Successfully installed global Dispatcher in WorkletContext!");
    });
  }
  return _workletContext;
}
#endif

std::future<std::shared_ptr<FilamentBuffer>> FilamentProxy::loadAssetAsync(const std::string& path) {
  Logger::log(TAG, "Loading asset %s...", path.c_str());
  auto weakThis = std::weak_ptr<FilamentProxy>(shared<FilamentProxy>());
  auto dispatcher = getBackgroundDispatcher();
  return dispatcher->runAsync<std::shared_ptr<FilamentBuffer>>([=]() {
    auto sharedThis = weakThis.lock();
    if (sharedThis != nullptr) {
      return this->loadAsset(path);
    } else {
      throw std::runtime_error("Failed to load asset, FilamentProxy has already been destroyed!");
    }
  });
}

std::future<std::shared_ptr<FilamentView>> FilamentProxy::findFilamentViewAsync(int id) {
  Logger::log(TAG, "Finding FilamentView #%i...", id);
  auto weakThis = std::weak_ptr<FilamentProxy>(shared<FilamentProxy>());
  auto dispatcher = getUIDispatcher();
  return dispatcher->runAsync<std::shared_ptr<FilamentView>>([=]() {
    auto sharedThis = weakThis.lock();
    if (sharedThis != nullptr) {
      return this->findFilamentView(id);
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
  Engine::Config config = EngineConfigHelper::makeConfigFromUserParams(arguments);
  Engine::Backend backendEnum = Engine::Backend::DEFAULT;
  if (backend.has_value()) {
    EnumMapper::convertJSUnionToEnum(backend.value(), &backendEnum);
  }

  std::shared_ptr<Choreographer> choreographer = createChoreographer();
  std::shared_ptr<Dispatcher> renderThread = getRenderThreadDispatcher();
  return std::make_shared<EngineWrapper>(choreographer, renderThread, std::move(config), backendEnum);
}

std::shared_ptr<BulletWrapper> FilamentProxy::createBullet() {
  Logger::log(TAG, "Creating Bullet...");
  return std::make_shared<BulletWrapper>();
}

} // namespace margelo
