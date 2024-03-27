//
// Created by Marc Rousavy on 12.03.24.
//

#pragma once

#include <functional>
#include <future>
#include <queue>

namespace margelo {

class Dispatcher {
 public:
  /**
   * Run the given void function synchronously on the Thread this Dispatcher is managing.
   * @param function
   */
  virtual void runSync(std::function<void()>&& function) = 0;

  /**
   * Run the given void function asynchronously on the Thread this Dispatcher is managing.
   */
  virtual void runAsync(std::function<void()>&& function) = 0;

  /**
   * Run the given function asynchronously on the Thread this Dispatcher is managing,
   * and return a future that will hold the result of the function.
   */
  template <typename T> std::future<T> runAsync(std::function<T()>&& function) {
    // 1. Create Promise that can be shared between this and dispatcher thread
    auto promise = std::make_shared<std::promise<T>>();
    std::future<T> future = promise->get_future();

    runAsync([function = std::move(function), promise]() {
      try {
        // 4. Call the actual function on the new Thread
        T result = function();
        // 5.a. Resolve the Promise if we succeeded
        promise->set_value(std::move(result));
      } catch (...) {
        // 5.b. Reject the Promise if the call failed
        promise->set_exception(std::current_exception());
      }
    });

    // 3. Return an open future that gets resolved later by the dispatcher Thread
    return future;
  }
};

} // namespace margelo
