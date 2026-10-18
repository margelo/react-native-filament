#include "HybridRenderThreadCleanup.hpp"

namespace margelo::nitro::filament {

void HybridRenderThreadCleanup::run() {
  if (taken_.exchange(true)) {
    return;
  }
  std::function<void()> cleanup = std::move(cleanup_);
  cleanup();
}

void HybridRenderThreadCleanup::dispose() {
  if (!taken_.exchange(true)) {
    cleanup_ = nullptr;
  }
}

} // namespace margelo::nitro::filament
