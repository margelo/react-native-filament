//
// Created for the react-native-worklets migration.
//

#pragma once

#include "RNFDispatcher.h"
#include "RNFWorkletRuntimeLock.h"
#include <memory>

namespace margelo {

/**
 * Runs jobs on the wrapped dispatcher while holding the worklet runtime's lock.
 * Installed as the global dispatcher of the Filament worklet runtime, so promises created on that
 * runtime resolve under the lock (see PromiseFactory).
 */
class WorkletRuntimeDispatcher : public Dispatcher {
public:
  WorkletRuntimeDispatcher(std::shared_ptr<Dispatcher> dispatcher, jsi::Runtime& runtime)
      : _dispatcher(std::move(dispatcher)), _lock(runtime) {}

  void runSync(std::function<void()>&& function) override {
    _dispatcher->runSync([lock = _lock, function = std::move(function)]() { lock.run(function); });
  }

  void runAsync(std::function<void()>&& function) override {
    _dispatcher->runAsync([lock = _lock, function = std::move(function)]() { lock.run(function); });
  }

private:
  std::shared_ptr<Dispatcher> _dispatcher;
  WorkletRuntimeLock _lock;
};

} // namespace margelo
