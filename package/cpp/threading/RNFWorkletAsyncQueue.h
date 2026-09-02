//
// Created for the react-native-worklets migration.
//

#pragma once

#include "RNFDispatcher.h"
#include <memory>

#if HAS_WORKLETS
#include <worklets/RunLoop/AsyncQueue.h>
#endif

namespace margelo {

#if HAS_WORKLETS
/**
 * The queue a react-native-worklets runtime drains its jobs from.
 * Every job is forwarded to Filament's render thread, so a worklet runtime created with
 * this queue runs on the same thread Filament renders on.
 */
class WorkletAsyncQueue : public worklets::AsyncQueue {
public:
  explicit WorkletAsyncQueue(std::shared_ptr<Dispatcher> dispatcher) : _dispatcher(std::move(dispatcher)) {}

  void push(std::function<void()>&& job) override {
    _dispatcher->runAsync(std::move(job));
  }

private:
  std::shared_ptr<Dispatcher> _dispatcher;
};
#endif // HAS_WORKLETS

} // namespace margelo
