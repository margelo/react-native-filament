//
// Created by Marc Rousavy on 12.03.24.
//

#pragma once

#include <functional>
#include <future>
#include <queue>

namespace margelo {

class Dispatcher {
private:
  std::queue<std::function<void()>> _jobs;
  std::mutex _mutex;

private:
  // Schedule trigger will be implemented by Android/iOS to schedule a call to `trigger()` on the target Thread.
  virtual void scheduleTrigger() = 0;

protected:
  // Trigger will run the latest job that has been added to the queue.
  void trigger() {
    std::unique_lock lock(_mutex);
    auto job = _jobs.front();
    job();
    _jobs.pop();
  }

public:
  void runAsyncNoAwait(std::function<void()>&& function) {
    std::unique_lock lock(_mutex);
    _jobs.push([function = std::move(function)]() {
      function();
    });
    scheduleTrigger();
  }

  template <typename T> std::future<T> runAsync(std::function<T()>&& function) {
    // 1. Create Promise that can be shared between this and dispatcher thread
    auto promise = std::make_shared<std::promise<T>>();
    std::future<T> future = promise->get_future();

    std::unique_lock lock(_mutex);
    _jobs.push([function = std::move(function), promise]() {
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
    scheduleTrigger();

    // 3. Return an open future that gets resolved later by the dispatcher Thread
    return future;
  }
};

} // namespace margelo
