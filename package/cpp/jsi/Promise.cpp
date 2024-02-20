#include "Promise.h"
#include <future>
#include <jsi/jsi.h>
#include <utility>
#include <vector>

namespace margelo {

using namespace facebook;

Promise::Promise(jsi::Runtime& runtime, jsi::Value resolver, jsi::Value rejecter)
    : runtime(runtime), _resolver(std::move(resolver)), _rejecter(std::move(rejecter)) {}

jsi::Value Promise::createPromise(jsi::Runtime& runtime,
                                  std::function<void(std::shared_ptr<Promise> promise)> run) {
  // Get Promise ctor from global
  auto promiseCtor = runtime.global().getPropertyAsFunction(runtime, "Promise");

  auto promiseCallback = jsi::Function::createFromHostFunction(
      runtime, jsi::PropNameID::forUtf8(runtime, "PromiseCallback"), 2,
      [=](jsi::Runtime& runtime, const jsi::Value& thisValue, const jsi::Value* arguments,
          size_t count) -> jsi::Value {
        // Call function
        auto promise = std::make_shared<Promise>(runtime, arguments[0].asObject(runtime),
                                                 arguments[1].asObject(runtime));
        run(promise);

        return jsi::Value::undefined();
      });

  return promiseCtor.callAsConstructor(runtime, promiseCallback);
}

void Promise::resolve(jsi::Value&& result) {
  _resolver.asObject(runtime).asFunction(runtime).call(runtime, std::move(result));
}

void Promise::reject(std::string message) {
  jsi::JSError error(runtime, message);
  _rejecter.asObject(runtime).asFunction(runtime).call(runtime, error.value());
}

} // namespace margelo
