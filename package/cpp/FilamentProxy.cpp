//
// Created by Marc Rousavy on 20.02.24.
//

#include "FilamentProxy.h"
#include <jsi/jsi.h>

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
#if HAS_WORKLETS
  registerHybridMethod("registerWorkletContext", &FilamentProxy::registerWorkletContext, this);
#endif
}

#if HAS_WORKLETS
void FilamentProxy::registerWorkletContext(std::shared_ptr<RNWorklet::JsiWorkletContext> context) {
  Logger::log(TAG, "Registering WorkletContext " + context->getName() + "...");
  context->invokeOnWorkletThread([context](RNWorklet::JsiWorkletContext*, jsi::Runtime& contextRuntime) {
    std::shared_ptr<Dispatcher> dispatcher = std::make_shared<WorkletContextDispatcher>(context);
    PromiseFactory::install(contextRuntime, dispatcher);
    Logger::log(TAG, "Successfully registered WorkletContext " + context->getName() + "!");
  });
}
#endif

std::future<std::shared_ptr<FilamentBuffer>> FilamentProxy::loadAssetAsync(std::string path) {
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

std::shared_ptr<EngineWrapper> FilamentProxy::createEngine() {
  Logger::log(TAG, "Creating Engine...");
  std::shared_ptr<Choreographer> choreographer = createChoreographer();
  auto dispatcher = getUIDispatcher();

  return std::make_shared<EngineWrapper>(choreographer, dispatcher);
}

std::shared_ptr<BulletWrapper> FilamentProxy::createBullet() {
  Logger::log(TAG, "Creating Bullet...");
  return std::make_shared<BulletWrapper>();
}

} // namespace margelo
