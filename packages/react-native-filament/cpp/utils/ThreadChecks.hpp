#pragma once

#include "threading/RenderThread.hpp"

#include <stdexcept>
#include <string>

namespace margelo::nitro::filament {

inline void requireRenderThread(const RenderThread& thread, const char* method) {
  if (!thread.isCurrentThread()) {
    throw std::runtime_error(
        std::string("FilamentThreadError: ") + method +
        " must run on the render thread of its Engine. Use runOnRenderThread(engine, ...) or call it from a frame listener.");
  }
}

} // namespace margelo::nitro::filament
