//
//  PromiseFactory.cpp
//  react-native-filament
//
//  Created by Marc Rousavy on 11.03.24.
//

#include "PromiseFactory.h"
#include "Logger.h"

namespace margelo {


void PromiseFactory::install(jsi::Runtime &runtime, const std::shared_ptr<react::CallInvoker> &callInvoker) {
  Logger::log(TAG, "Installing global PromiseFactory bindings...");
  
  jsi::Object callInvokerHolder(runtime);
  auto nativeState = std::make_shared<CallInvokerNativeState>(callInvoker);
  callInvokerHolder.setNativeState(runtime, nativeState);
  runtime.global().setProperty(runtime,
                               GLOBAL_PROMISE_FACTORY_CALL_INVOKER_HOLDER_NAME,
                               callInvokerHolder);
}


jsi::Value PromiseFactory::createPromise(jsi::Runtime &runtime, RunPromise&& run) {
#if DEBUG
  if (!runtime.global().hasProperty(runtime, GLOBAL_PROMISE_FACTORY_CALL_INVOKER_HOLDER_NAME)) {
    throw jsi::JSError(runtime, "Failed to create Promise - the global CallInvoker holder does not exist! "
                       "Was PromiseFactory::install() called for this jsi::Runtime? "
                       "(global." + std::string(GLOBAL_PROMISE_FACTORY_CALL_INVOKER_HOLDER_NAME) + " == undefined)");
  }
#endif
  jsi::Object callInvokerHolder = runtime.global().getPropertyAsObject(runtime,
                                                                       GLOBAL_PROMISE_FACTORY_CALL_INVOKER_HOLDER_NAME);
  
#if DEBUG
  if (!callInvokerHolder.hasNativeState(runtime)) {
    throw jsi::JSError(runtime, "Failed to create Promise - the global CallInvoker holder "
                       "(global." + std::string(GLOBAL_PROMISE_FACTORY_CALL_INVOKER_HOLDER_NAME) + ") does not "
                       "hold a CallInvoker in it's native state! "
                       "Was PromiseFactory::install() called for this jsi::Runtime?");
  }
#endif
  std::shared_ptr<CallInvokerNativeState> callInvokerState = callInvokerHolder.getNativeState<CallInvokerNativeState>(runtime);
  
  return Promise::createPromise(runtime, [callInvokerState, run = std::move(run)](jsi::Runtime& runtime,
                                                                                  const std::shared_ptr<Promise>& promise) {
    run(runtime, promise, callInvokerState->getCallInvoker());
  });
}

}
