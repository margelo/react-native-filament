#include "FrameListeners.hpp"

#include "utils/Logger.hpp"

#include <algorithm>

namespace margelo::nitro::filament {

std::shared_ptr<FrameListener> FrameListeners::add(std::function<bool(const FrameInfo&)> callback) {
  auto listener = std::make_shared<FrameListener>(std::move(callback));
  listeners_.push_back(listener);
  return listener;
}

void FrameListeners::remove(const std::shared_ptr<FrameListener>& listener) {
  std::erase(listeners_, listener);
}

void FrameListeners::clear() {
  listeners_.clear();
}

bool FrameListeners::empty() const {
  return listeners_.empty();
}

bool FrameListeners::dispatch(const FrameInfo& frame, const worklets::WorkletRuntime& runtime) {
  std::vector<std::shared_ptr<FrameListener>> snapshot = listeners_;
  bool wantsFrame = false;
  runtime.runSync([&](jsi::Runtime&) {
    for (const std::shared_ptr<FrameListener>& listener : snapshot) {
      if (listener->removed) {
        continue;
      }
      try {
        wantsFrame = listener->callback(frame) || wantsFrame;
      } catch (const std::exception& error) {
        logError(std::string("A frame listener threw: ") + error.what());
      }
    }
  });
  return wantsFrame;
}

} // namespace margelo::nitro::filament
