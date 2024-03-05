//
// Created by Marc Rousavy on 20.02.24.
//

#include "FilamentProxy.h"
#include <jsi/jsi.h>
#include "JSDispatchQueue.h"

#include "jsi/Promise.h"
#include <memory>
#include <string>
#include <utility>
#include <vector>

namespace margelo {

using namespace facebook;

void FilamentProxy::loadHybridMethods() {
  registerHybridMethod("getAssetByteBuffer", &FilamentProxy::getAssetByteBuffer, this);
  registerHybridMethod("findFilamentView", &FilamentProxy::findFilamentView, this);
  registerHybridMethod("createTestObject", &FilamentProxy::createTestObject, this);
  registerHybridMethod("createEngine", &FilamentProxy::createEngine, this);
  registerHybridMethod("createChoreographer", &FilamentProxy::createChoreographer, this);
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
