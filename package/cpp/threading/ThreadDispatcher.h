//
//  ThreadDispatcher.h
//  react-native-filament
//
//  Created by Marc Rousavy on 02.04.24.
//

#pragma once

#include <atomic>
#include <condition_variable>
#include <functional>
#include <future>
#include <mutex>
#include <queue>
#include <thread>

#include "Dispatcher.h"

namespace margelo {

/**
 An implementation of Dispatcher that uses a single standard C++ Thread for scheduling tasks.
 */
class ThreadDispatcher : public Dispatcher {
public:
  explicit ThreadDispatcher();
  ~ThreadDispatcher();

  void runSync(std::function<void()>&& function) override;
  void runAsync(std::function<void()>&& function) override;

private:
  void runLoop();

private:
  std::atomic<bool> _didRequestStop;
  std::thread _thread;
  std::mutex _mutex;
  std::condition_variable _condition;
  std::queue<std::function<void()>> _tasks;
};

} // namespace margelo
