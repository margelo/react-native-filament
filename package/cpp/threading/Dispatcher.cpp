#include "Dispatcher.h"
#include "Logger.h"
#include "Logger.h"

namespace margelo {

using namespace facebook;

static constexpr auto GLOBAL_PROMISE_FACTORY_DISPATCHER_HOLDER_NAME = "__promiseFactoryDispatcher";

void Dispatcher::installRuntimeGlobalDispatcher(jsi::Runtime& runtime, std::shared_ptr<Dispatcher> dispatcher) {
  Logger::log(TAG, "Installing global Dispatcher Holder...");

  auto dispatcherHolder = jsi::Object::createFromHostObject(runtime, dispatcher);
  runtime.global().setProperty(runtime, GLOBAL_PROMISE_FACTORY_DISPATCHER_HOLDER_NAME, dispatcherHolder);
}

std::shared_ptr<Dispatcher> Dispatcher::getRuntimeGlobalDispatcher(jsi::Runtime& runtime) {
  jsi::Value dispatcherHolderValue = getRuntimeGlobalDispatcherHolder(runtime);
  jsi::Object dispatcherHolder = dispatcherHolderValue.asObject(runtime);
  return dispatcherHolder.getHostObject<Dispatcher>(runtime);
}

jsi::Value Dispatcher::getRuntimeGlobalDispatcherHolder(jsi::Runtime& runtime) {
#if DEBUG
  if (!runtime.global().hasProperty(runtime, GLOBAL_PROMISE_FACTORY_DISPATCHER_HOLDER_NAME)) {
    throw jsi::JSError(runtime, "Failed to get current Dispatcher - the global Dispatcher holder does not exist! "
                                "Was Dispatcher::installDispatcherIntoRuntime() called for this jsi::Runtime? "
                                "(global." +
                                    std::string(GLOBAL_PROMISE_FACTORY_DISPATCHER_HOLDER_NAME) + " == undefined)");
  }
#endif
  return runtime.global().getProperty(runtime, GLOBAL_PROMISE_FACTORY_DISPATCHER_HOLDER_NAME);
}

} // namespace margelo
