//
// Created by Marc Rousavy on 20.02.24.
//

#include "FilamentProxy.h"
#include <jsi/jsi.h>

#include "jsi/Promise.h"
#include <memory>
#include <string>
#include <utility>
#include <vector>

namespace margelo {

using namespace facebook;

void FilamentProxy::loadHybridMethods() {
  registerHybridMethod("loadModel", &FilamentProxy::loadModel, this);
  registerHybridMethod("findFilamentView", &FilamentProxy::findFilamentView, this);
  registerHybridMethod("createTestObject", &FilamentProxy::createTestObject, this);
  registerHybridMethod("createEngine", &FilamentProxy::createEngine, this);
  registerHybridMethod("createChoreographer", &FilamentProxy::createChoreographer, this);
}

std::shared_ptr<TestHybridObject> FilamentProxy::createTestObject() {
  return std::make_shared<TestHybridObject>();
}

std::shared_ptr<EngineWrapper> FilamentProxy::createEngine() {
  return std::make_shared<EngineWrapper>(createChoreographer());
}

} // namespace margelo
