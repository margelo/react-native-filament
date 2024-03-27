//
// Created by Marc Rousavy on 20.02.24.
//

#include "FilamentProxy.h"
#include "JSDispatchQueue.h"
#include <jsi/jsi.h>

#include "jsi/Promise.h"
#include <memory>
#include <string>
#include <utility>
#include <vector>

namespace margelo {

using namespace facebook;

FilamentProxy::FilamentProxy(): HybridObject("FilamentProxy") {
  std::weak_ptr<FilamentProxy> weakSelf = shared<FilamentProxy>();
  auto runOnJS = [weakSelf](std::function<void()>&& f) {
    // Run on React JS Runtime
    auto self = weakSelf.lock();
    if (self) {
      self->getCallInvoker()->invokeAsync(std::move(f));
    }
  };
  auto runOnWorklet = [weakSelf](std::function<void()>&& f) {
    // Run on Filament Worklet Runtime
    auto self = weakSelf.lock();
    if (self) {
      self->getFilamentRendererDispatcher()->runAsyncNoAwait(std::move(f));
    }
  };
  // TODO: Get jsi::Runtime here!
  jsi::Runtime* runtime = nullptr;
  this->_workletContext = std::make_shared<RNWorklet::JsiWorkletContext>("Filament", runtime, runOnJS, runOnWorklet);
}

void FilamentProxy::loadHybridMethods() {
  registerHybridMethod("loadAsset", &FilamentProxy::loadAssetAsync, this);
  registerHybridMethod("findFilamentView", &FilamentProxy::findFilamentViewAsync, this);
  registerHybridMethod("createTestObject", &FilamentProxy::createTestObject, this);
  registerHybridMethod("createEngine", &FilamentProxy::createEngine, this);
  registerHybridMethod("createBullet", &FilamentProxy::createBullet, this);
  registerHybridGetter("workletContext", &FilamentProxy::getWorkletContext, this);
}

std::shared_ptr<RNWorklet::JsiWorkletContext> FilamentProxy::getWorkletContext() {
  return _workletContext;
}

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
  return std::make_shared<TestHybridObject>();
}

std::shared_ptr<EngineWrapper> FilamentProxy::createEngine() {
  std::shared_ptr<Choreographer> choreographer = createChoreographer();
  auto jsDispatchQueue = std::make_shared<JSDispatchQueue>(getCallInvoker());
  return std::make_shared<EngineWrapper>(choreographer, jsDispatchQueue);
}

std::shared_ptr<BulletWrapper> FilamentProxy::createBullet() {
  return std::make_shared<BulletWrapper>();
}

} // namespace margelo
