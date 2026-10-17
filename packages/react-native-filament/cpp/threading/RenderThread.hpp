#pragma once

#include "Job.hpp"
#include "RenderLoop.hpp"

#include <deque>
#include <functional>
#include <mutex>
#include <optional>
#include <thread>

namespace margelo::nitro::filament {

class RenderThread final : private RenderLoopDelegate {
public:
  using VsyncHandler = std::function<void(int64_t frameTimeNanos)>;

  explicit RenderThread(VsyncHandler onVsync);
  ~RenderThread() override;

  bool post(Job job);
  bool postFront(Job job);
  bool isCurrentThread() const;

  void setVsyncEnabled(bool enabled);
  void close();
  void quit();
  void join();

private:
  bool enqueue(Job job, bool front);
  std::optional<Job> takeNext();
  void onWake() override;
  void onVsync(int64_t frameTimeNanos) override;

  VsyncHandler onVsync_;
  std::mutex mutex_;
  std::deque<Job> jobs_;
  bool closed_ = false;
  RenderLoop* loop_ = nullptr;
  std::thread thread_;
  std::thread::id threadId_;
};

} // namespace margelo::nitro::filament
