//
//  ThreadDispatcher.cpp
//  react-native-filament
//
//  Created by Marc Rousavy on 02.04.24.
//

#include "ThreadDispatcher.h"
#include <atomic>
#include <condition_variable>
#include <functional>
#include <future>
#include <mutex>
#include <queue>
#include <thread>

namespace margelo {

ThreadDispatcher::ThreadDispatcher() : _thread(&ThreadDispatcher::runLoop, this), _didRequestStop(false) {}

ThreadDispatcher::~ThreadDispatcher() {
  {
    std::unique_lock<std::mutex> lock(_mutex);
    _didRequestStop = true;
  }
  _condition.notify_one();
  _thread.join();
}

void ThreadDispatcher::runLoop() {
  while (true) {
    std::function<void()> task;
    {
      std::unique_lock<std::mutex> lock(_mutex);
      _condition.wait(lock, [this] { return _didRequestStop || !_tasks.empty(); });
      if (_didRequestStop && _tasks.empty())
        return;
      task = std::move(_tasks.front());
      _tasks.pop();
    }
    task();
  }
}

void ThreadDispatcher::runSync(std::function<void()>&& function) {
  auto future = std::make_shared<std::promise<void>>();
  auto futureObj = future->get_future();
  {
    std::unique_lock<std::mutex> lock(_mutex);
    _tasks.push([future, function = std::move(function)]() {
      function();
      future->set_value();
    });
  }
  _condition.notify_one();
  futureObj.wait();
}

void ThreadDispatcher::runAsync(std::function<void()>&& function) {
  {
    std::unique_lock<std::mutex> lock(_mutex);
    _tasks.push(std::move(function));
  }
  _condition.notify_one();
}

} // namespace margelo
