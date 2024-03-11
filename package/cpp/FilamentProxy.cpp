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

void FilamentProxy::loadHybridMethods() {
  registerHybridMethod("loadAsset", &FilamentProxy::loadAssetAsync, this);
  registerHybridMethod("findFilamentView", &FilamentProxy::findFilamentView, this);
  registerHybridMethod("createTestObject", &FilamentProxy::createTestObject, this);
  registerHybridMethod("createEngine", &FilamentProxy::createEngine, this);
}

std::future<std::shared_ptr<FilamentBuffer>> FilamentProxy::loadAssetAsync(std::string path) {
  auto weakThis = std::weak_ptr<FilamentProxy>(shared<FilamentProxy>());
  return std::async(std::launch::async, [=]() {
    auto sharedThis = weakThis.lock();
    if (sharedThis != nullptr) {
      return this->loadAsset(path);
    } else {
      throw std::runtime_error("Failed to load asset, FilamentProxy has already been destroyed!");
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

} // namespace margelo
