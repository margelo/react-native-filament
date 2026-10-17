#pragma once

#include "FrameInfo.hpp"

#include <worklets/WorkletRuntime/WorkletRuntime.h>

#include <atomic>
#include <functional>
#include <memory>
#include <vector>

namespace margelo::nitro::filament {

struct FrameListener {
  explicit FrameListener(std::function<bool(const FrameInfo&)> callback) : callback(std::move(callback)) {}

  std::function<bool(const FrameInfo&)> callback;
  std::atomic<bool> removed{false};
};

class FrameListeners final {
public:
  std::shared_ptr<FrameListener> add(std::function<bool(const FrameInfo&)> callback);
  void remove(const std::shared_ptr<FrameListener>& listener);
  void clear();
  bool empty() const;
  bool dispatch(const FrameInfo& frame, const worklets::WorkletRuntime& runtime);

private:
  std::vector<std::shared_ptr<FrameListener>> listeners_;
};

} // namespace margelo::nitro::filament
