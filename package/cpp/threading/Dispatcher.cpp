#include "Dispatcher.h"
#include "Logger.h"
#include "Logger.h"

namespace margelo {

using namespace facebook;

static constexpr auto GLOBAL_PROMISE_FACTORY_DISPATCHER_HOLDER_NAME = "__promiseFactoryDispatcher";

void Dispatcher::installDispatcherIntoRuntime(jsi::Runtime& runtime, std::shared_ptr<Dispatcher> dispatcher) {
  Logger::log(TAG, "Installing global PromiseFactory bindings...");

  jsi::Object dispatcherHolder(runtime);
  auto nativeState = std::make_shared<DispatcherNativeState>(dispatcher);
  dispatcherHolder.setNativeState(runtime, nativeState);
  runtime.global().setProperty(runtime, GLOBAL_PROMISE_FACTORY_DISPATCHER_HOLDER_NAME, dispatcherHolder);
}

std::shared_ptr<Dispatcher> Dispatcher::getRuntimeGlobalDispatcher(jsi::Runtime& runtime) {
#if DEBUG
  if (!runtime.global().hasProperty(runtime, GLOBAL_PROMISE_FACTORY_DISPATCHER_HOLDER_NAME)) {
    throw jsi::JSError(runtime, "Failed to create Promise - the global Dispatcher holder does not exist! "
                                "Was PromiseFactory::install() called for this jsi::Runtime? "
                                "(global." +
                                    std::string(GLOBAL_PROMISE_FACTORY_DISPATCHER_HOLDER_NAME) + " == undefined)");
  }
#endif

  jsi::Object callInvokerHolder = runtime.global().getPropertyAsObject(runtime, GLOBAL_PROMISE_FACTORY_DISPATCHER_HOLDER_NAME);

#if DEBUG
  if (!callInvokerHolder.hasNativeState(runtime)) {
    throw jsi::JSError(runtime, "Failed to create Promise - the global Dispatcher holder "
                                "(global." +
                                    std::string(GLOBAL_PROMISE_FACTORY_DISPATCHER_HOLDER_NAME) +
                                    ") does not "
                                    "hold a Dispatcher in it's native state! "
                                    "Was PromiseFactory::install() called for this jsi::Runtime?");
  }
#endif
  std::shared_ptr<DispatcherNativeState> dispatcherState = callInvokerHolder.getNativeState<DispatcherNativeState>(runtime);

  return dispatcherState.getDispatcher();
}

} // namespace margelo
