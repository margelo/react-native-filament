//
// Created by Marc Rousavy on 20.02.24.
//

#include "FilamentProxy.h"
#include <jsi/jsi.h>

#include <memory>
#include <string>
#include <vector>
#include "jsi/Promise.h"

namespace margelo {

using namespace facebook;

std::vector<jsi::PropNameID> FilamentProxy::getPropertyNames(jsi::Runtime& runtime) {
  std::vector<jsi::PropNameID> result;
  // TODO(hanno): add more methods here?
  result.push_back(jsi::PropNameID::forUtf8(runtime, std::string("loadModel")));
  return result;
}

jsi::Value FilamentProxy::get(jsi::Runtime& runtime, const jsi::PropNameID& propName) {
  auto name = propName.utf8(runtime);

  if (name == "loadModel") {
    return jsi::Function::createFromHostFunction(
        runtime, jsi::PropNameID::forUtf8(runtime, "loadModel"), 1,
        [this](jsi::Runtime& runtime, const jsi::Value& thisValue, const jsi::Value* arguments, size_t count) -> jsi::Value {
          // TODO(hanno): If this should be sync, we don't need a Promise.
          return Promise::createPromise(runtime, [this](std::shared_ptr<Promise> promise) -> {
            // TODO(hanno): If this should be async, we need to run this on a separate Thread (ask me for a Thread Pool implementation),
            // then dispatch back to the JS Thread for safely resolving the Promise using the CallInvoker.
            auto model = this->loadModel();
            promise->resolve(model);
          });
        });
  }

  return jsi::Value::undefined();
}
