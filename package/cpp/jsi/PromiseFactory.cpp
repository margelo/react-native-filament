//
//  PromiseFactory.cpp
//  react-native-filament
//
//  Created by Marc Rousavy on 11.03.24.
//

#include "PromiseFactory.h"
#include "Logger.h"

namespace margelo {

void PromiseFactory::install(jsi::Runtime& runtime, std::shared_ptr<Dispatcher> dispatcher) {
  Logger::log(TAG, "Installing global PromiseFactory bindings...");

  jsi::Object dispatcherHolder(runtime);
  auto nativeState = std::make_shared<DispatcherNativeState>(dispatcher);
  dispatcherHolder.setNativeState(runtime, nativeState);
  runtime.global().setProperty(runtime, GLOBAL_PROMISE_FACTORY_DISPATCHER_HOLDER_NAME, dispatcherHolder);
}

jsi::Value PromiseFactory::createPromise(jsi::Runtime& runtime, RunPromise&& run) {
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

  return Promise::createPromise(runtime, [dispatcherState, run = std::move(run)](jsi::Runtime& runtime, std::shared_ptr<Promise> promise) {
    run(runtime, promise, dispatcherState->getDispatcher());
  });
}

} // namespace margelo
