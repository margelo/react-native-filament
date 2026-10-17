#pragma once

#include <condition_variable>
#include <deque>
#include <functional>
#include <mutex>
#include <thread>
#include <vector>

namespace margelo::nitro::filament {

class WorkerPool final {
public:
  static WorkerPool& shared();

  void post(std::function<void()> task);

private:
  explicit WorkerPool(size_t threadCount);
  std::function<void()> next();

  std::mutex mutex_;
  std::condition_variable available_;
  std::deque<std::function<void()>> tasks_;
  std::vector<std::thread> threads_;
};

} // namespace margelo::nitro::filament
