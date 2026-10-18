#include "WorkerPool.hpp"

#include <pthread.h>

namespace margelo::nitro::filament {

WorkerPool& WorkerPool::shared() {
  static WorkerPool* pool = new WorkerPool(2);
  return *pool;
}

WorkerPool::WorkerPool(size_t threadCount) {
  for (size_t i = 0; i < threadCount; i++) {
    threads_.emplace_back([this] {
#ifdef __APPLE__
      pthread_setname_np("FilamentWorker");
#else
      pthread_setname_np(pthread_self(), "FilamentWorker");
#endif
      for (std::function<void()> task = next(); task; task = next()) {
        task();
      }
    });
  }
}

void WorkerPool::post(std::function<void()> task) {
  {
    std::unique_lock lock(mutex_);
    tasks_.push_back(std::move(task));
  }
  available_.notify_one();
}

std::function<void()> WorkerPool::next() {
  std::unique_lock lock(mutex_);
  available_.wait(lock, [this] { return !tasks_.empty(); });
  std::function<void()> task = std::move(tasks_.front());
  tasks_.pop_front();
  return task;
}

} // namespace margelo::nitro::filament
