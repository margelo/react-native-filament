//
//  PromiseFactory.hpp
//  react-native-filament
//
//  Created by Marc Rousavy on 11.03.24.
//

#pragma once

#include "Promise.h"
#include "threading/Dispatcher.h"
#include <ReactCommon/CallInvoker.h>
#include <jsi/jsi.h>
#include <memory>

namespace margelo {

class DispatcherNativeState : public jsi::NativeState {
public:
  explicit DispatcherNativeState(const std::shared_ptr<Dispatcher>& dispatcher) : _dispatcher(dispatcher) {}
  const std::shared_ptr<Dispatcher>& getDispatcher() {
    return _dispatcher;
  }

private:
  std::shared_ptr<Dispatcher> _dispatcher;
};

class PromiseFactory {
public:
  using RunPromise =
      std::function<void(jsi::Runtime& runtime, const std::shared_ptr<Promise>& promise, const std::shared_ptr<Dispatcher>& dispatcher)>;

  /**
   Install the Promise Factory into the given Runtime.
   This will inject a global property in the Runtime that will hold a Dispatcher to run code on the given Runtime.
   For the default JS Context, this can be a CallInvokerDispatcher.
   For a Worklet Context, this can be a WorkletContextDispatcher.
   */
  static void install(jsi::Runtime& runtime, const std::shared_ptr<Dispatcher>& dispatcher);

  /**
   Create a new promise and run the given function.
   The caller needs to ensure that the Promise is resolved eventually (on the JS thread with the CallInvoker).
   */
  static jsi::Value createPromise(jsi::Runtime& runtime, RunPromise&& run);

private:
  static constexpr auto GLOBAL_PROMISE_FACTORY_DISPATCHER_HOLDER_NAME = "__promiseFactoryDispatcher";
  static constexpr auto TAG = "PromiseFactory";

private:
  PromiseFactory() = delete;
};

} // namespace margelo
