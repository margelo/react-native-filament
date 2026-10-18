#include "ManipulatorCommandQueue.hpp"

#include <stdexcept>
#include <string>

namespace margelo::nitro::filament {

ManipulatorCommandQueue::ManipulatorCommandQueue() {
  front_.reserve(kCapacity);
  back_.reserve(kCapacity);
}

void ManipulatorCommandQueue::grabBegin(float x, float y, bool strafe) {
  std::unique_lock lock(mutex_);
  requireRoom(2, "CameraManipulator.grabBegin()");
  if (activeSession_.has_value()) {
    front_.emplace_back(GrabEnd{.session = *activeSession_});
  }
  activeSession_ = nextSession_++;
  front_.emplace_back(GrabBegin{.x = x, .y = y, .strafe = strafe, .session = *activeSession_});
  reservedEnd_ = 1;
}

void ManipulatorCommandQueue::grabUpdate(float x, float y) {
  std::unique_lock lock(mutex_);
  if (!activeSession_.has_value()) {
    return;
  }
  GrabUpdate update{.x = x, .y = y, .session = *activeSession_};
  if (!front_.empty()) {
    if (auto* previous = std::get_if<GrabUpdate>(&front_.back()); previous != nullptr && previous->session == update.session) {
      *previous = update;
      return;
    }
  }
  if (admits(1)) {
    front_.emplace_back(update);
    return;
  }
  for (auto pending = front_.rbegin(); pending != front_.rend(); ++pending) {
    if (auto* previous = std::get_if<GrabUpdate>(&*pending); previous != nullptr && previous->session == update.session) {
      *previous = update;
      return;
    }
  }
  requireRoom(1, "CameraManipulator.grabUpdate()");
}

void ManipulatorCommandQueue::grabEnd() {
  std::unique_lock lock(mutex_);
  if (!activeSession_.has_value()) {
    return;
  }
  front_.emplace_back(GrabEnd{.session = *activeSession_});
  activeSession_.reset();
  reservedEnd_ = 0;
}

void ManipulatorCommandQueue::scroll(float x, float y, float delta) {
  std::unique_lock lock(mutex_);
  if (!front_.empty()) {
    if (auto* previous = std::get_if<Scroll>(&front_.back()); previous != nullptr && previous->x == x && previous->y == y) {
      previous->delta += delta;
      return;
    }
  }
  requireRoom(1, "CameraManipulator.scroll()");
  front_.emplace_back(Scroll{.x = x, .y = y, .delta = delta});
}

void ManipulatorCommandQueue::jumpToHome() {
  std::unique_lock lock(mutex_);
  requireRoom(1, "CameraManipulator.jumpToHome()");
  front_.emplace_back(JumpToHome{});
}

const std::vector<ManipulatorCommand>& ManipulatorCommandQueue::swap() {
  std::unique_lock lock(mutex_);
  front_.swap(back_);
  return back_;
}

void ManipulatorCommandQueue::recycle() {
  back_.clear();
}

bool ManipulatorCommandQueue::admits(size_t extra) const {
  return front_.size() + extra + reservedEnd_ <= kCapacity;
}

void ManipulatorCommandQueue::requireRoom(size_t extra, const char* method) const {
  if (!admits(extra)) {
    throw std::runtime_error(std::string("FilamentQueueFullError: ") + method + " was rejected because " + std::to_string(kCapacity) +
                             " commands are already waiting for the next frame.");
  }
}

} // namespace margelo::nitro::filament
