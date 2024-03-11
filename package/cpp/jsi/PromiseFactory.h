//
//  PromiseFactory.hpp
//  react-native-filament
//
//  Created by Marc Rousavy on 11.03.24.
//

#pragma once

#include "Promise.h"
#include <ReactCommon/CallInvoker.h>
#include <jsi/jsi.h>
#include <memory>

namespace margelo {

class CallInvokerNativeState : public jsi::NativeState {
public:
  explicit CallInvokerNativeState(const std::shared_ptr<react::CallInvoker>& callInvoker) : _callInvoker(callInvoker) {}
  const std::shared_ptr<react::CallInvoker>& getCallInvoker() {
    return _callInvoker;
  }

private:
  std::shared_ptr<react::CallInvoker> _callInvoker;
};

class PromiseFactory {
public:
  using RunPromise = std::function<void(jsi::Runtime& runtime, const std::shared_ptr<Promise>& promise,
                                        const std::shared_ptr<react::CallInvoker>& callInvoker)>;

  /**
   Install the Promise Factory into the given Runtime.
   This will inject a global property in the Runtime that will hold a CallInvoker.
   */
  static void install(jsi::Runtime& runtime, const std::shared_ptr<react::CallInvoker>& callInvoker);

  /**
   Create a new promise and run the given function.
   The caller needs to ensure that the Promise is resolved eventually (on the JS thread with the CallInvoker).
   */
  static jsi::Value createPromise(jsi::Runtime& runtime, RunPromise&& run);

private:
  static constexpr auto GLOBAL_PROMISE_FACTORY_CALL_INVOKER_HOLDER_NAME = "__promiseFactoryCallInvoker";
  static constexpr auto TAG = "PromiseFactory";

private:
  PromiseFactory() = delete;
};

} // namespace margelo
