//
// Created by Marc Rousavy on 20.02.24.
//

#include "FilamentProxy.h"
#include <jsi/jsi.h>

#include "jsi/Promise.h"
#include <memory>
#include <string>
#include <vector>

namespace margelo {

using namespace facebook;

std::vector<jsi::PropNameID> FilamentProxy::getPropertyNames(jsi::Runtime& runtime) {
  std::vector<jsi::PropNameID> result;
  // TODO(hanno): add more methods here?
    result.push_back(jsi::PropNameID::forUtf8(runtime, std::string("loadModel")));
    result.push_back(jsi::PropNameID::forUtf8(runtime, std::string("createEngine")));
  return result;
}

jsi::Value FilamentProxy::get(jsi::Runtime& runtime, const jsi::PropNameID& propName) {
  auto name = propName.utf8(runtime);

  if (name == "loadModel") {
    return jsi::Function::createFromHostFunction(
        runtime, jsi::PropNameID::forUtf8(runtime, "loadModel"), 1,
        [this](jsi::Runtime& runtime, const jsi::Value& thisValue, const jsi::Value* arguments, size_t count) -> jsi::Value {
          if (count != 1) {
            [[unlikely]];
            throw jsi::JSError(runtime, "loadModel: Expected 1 argument(s), but received " + std::to_string(count) + "!");
          }
          std::string path = arguments[0].asString(runtime).utf8(runtime);
          // TODO(hanno): If this should be sync, we don't need a Promise.
          return Promise::createPromise(runtime, [=](std::shared_ptr<Promise> promise) {
            // TODO(hanno): If this should be async, we need to run this on a separate Thread (ask me for a Thread Pool implementation),
            // then dispatch back to the JS Thread for safely resolving the Promise using the CallInvoker.
            auto model = this->loadModel(path);
            promise->resolve(model);
          });
        });
  }
    if (name == "createEngine") {
        return jsi::Function::createFromHostFunction(
                runtime, jsi::PropNameID::forUtf8(runtime, "createEngine"), 1,
                [](jsi::Runtime& runtime, const jsi::Value& thisValue, const jsi::Value* arguments, size_t count) -> jsi::Value {
                    if (count != 1) {
                        [[unlikely]];
                        throw jsi::JSError(runtime, "createEngine: Expected 1 argument(s), but received " + std::to_string(count) + "!");
                    }
                    std::string backend = arguments[0].asString(runtime).utf8(runtime);

                    return jsi::Value(13);
                });
    }

  return jsi::Value::undefined();
}

} // namespace margelo
