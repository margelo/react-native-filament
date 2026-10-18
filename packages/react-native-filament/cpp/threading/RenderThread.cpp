#include "RenderThread.hpp"

#include "utils/Logger.hpp"

#include <exception>
#include <string>

namespace margelo::nitro::filament {

RenderThread::RenderThread(VsyncHandler onVsync) : onVsync_(std::move(onVsync)) {
  std::unique_lock lock(mutex_);
  thread_ = std::thread([this] {
    std::unique_ptr<RenderLoop> loop = createRenderLoop(*this);
    {
      std::unique_lock lock(mutex_);
      loop_ = loop.get();
      if (!jobs_.empty()) {
        loop_->wake();
      }
    }
    loop->run();
    std::unique_lock lock(mutex_);
    loop_ = nullptr;
  });
  threadId_ = thread_.get_id();
}

RenderThread::~RenderThread() {
  if (thread_.joinable()) {
    std::terminate();
  }
}

bool RenderThread::post(Job job) {
  return enqueue(std::move(job), false);
}

bool RenderThread::postFront(Job job) {
  return enqueue(std::move(job), true);
}

bool RenderThread::enqueue(Job job, bool front) {
  {
    std::unique_lock lock(mutex_);
    if (!closed_) {
      if (front) {
        jobs_.push_front(std::move(job));
      } else {
        jobs_.push_back(std::move(job));
      }
      if (loop_ != nullptr) {
        loop_->wake();
      }
      return true;
    }
  }
  if (job.cancel) {
    job.cancel();
  }
  return false;
}

bool RenderThread::isCurrentThread() const {
  return std::this_thread::get_id() == threadId_;
}

void RenderThread::setVsyncEnabled(bool enabled) {
  loop_->setVsyncEnabled(enabled);
}

void RenderThread::close() {
  std::deque<Job> pending;
  {
    std::unique_lock lock(mutex_);
    closed_ = true;
    pending.swap(jobs_);
  }
  for (Job& job : pending) {
    if (job.cancel) {
      job.cancel();
    }
  }
}

void RenderThread::quit() {
  loop_->quit();
}

void RenderThread::join() {
  thread_.join();
}

std::optional<Job> RenderThread::takeNext() {
  std::unique_lock lock(mutex_);
  if (jobs_.empty()) {
    return std::nullopt;
  }
  Job job = std::move(jobs_.front());
  jobs_.pop_front();
  return job;
}

void RenderThread::onWake() {
  for (std::optional<Job> job = takeNext(); job.has_value(); job = takeNext()) {
    runGuarded("A render thread job", job->run);
  }
}

void RenderThread::onVsync(int64_t frameTimeNanos) {
  runGuarded("A frame", [&] { onVsync_(frameTimeNanos); });
}

void RenderThread::runGuarded(const char* what, const std::function<void()>& work) {
  try {
    work();
  } catch (const std::exception& error) {
    logError(std::string(what) + " threw: " + error.what());
  } catch (...) {
    logError(std::string(what) + " threw a non-standard exception.");
  }
}

} // namespace margelo::nitro::filament
