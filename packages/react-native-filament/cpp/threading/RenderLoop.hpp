#pragma once

#include <cstdint>
#include <memory>

namespace margelo::nitro::filament {

class RenderLoopDelegate {
public:
  virtual ~RenderLoopDelegate() = default;
  virtual void onWake() = 0;
  virtual void onVsync(int64_t frameTimeNanos) = 0;
};

class RenderLoop {
public:
  virtual ~RenderLoop() = default;
  virtual void wake() = 0;
  virtual void setVsyncEnabled(bool enabled) = 0;
  virtual void run() = 0;
  virtual void quit() = 0;
};

std::unique_ptr<RenderLoop> createRenderLoop(RenderLoopDelegate& delegate);

} // namespace margelo::nitro::filament
