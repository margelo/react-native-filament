//
// Created by Marc Rousavy on 12.03.24.
//

#pragma once

#include <functional>
#include <future>

namespace margelo {

class Dispatcher {
 private:
  virtual void dispatch(std::function<void()>&& function) = 0;

 public:
  template<typename T>
  std::future<T> runAsync(std::function<T()>&& function) {
    // 1. Create Promise that can be shared between this and dispatcher thread
    auto promise = std::make_shared<std::promise<T>>();
    // 2. Dispatch the call to the new Thread, implementation specific
    dispatch([function = std::move(function), promise]() {
      try {
        // 4. Call the actual function on the new Thread
        T result = function();
        // 5.a. Resolve the Promise if we succeeded
        promise->set_value(std::move(result));
      } catch (...) {
        // 6.b. Reject the Promise if the call failed
        promise->set_exception(std::current_exception());
      }
    });
    // 3. Return an open future that gets resolved later by the dispatcher Thread
    return promise->get_future();
  }
};

} // margelo

