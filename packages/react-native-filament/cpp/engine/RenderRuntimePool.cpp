#include "RenderRuntimePool.hpp"

namespace margelo::nitro::filament {

std::optional<RenderRuntimePool::Entry> RenderRuntimePool::acquire() {
  std::unique_lock lock(mutex_);
  if (idle_.empty()) {
    return std::nullopt;
  }
  Entry entry = std::move(idle_.back());
  idle_.pop_back();
  return entry;
}

void RenderRuntimePool::release(Entry entry) {
  std::unique_lock lock(mutex_);
  idle_.push_back(std::move(entry));
}

} // namespace margelo::nitro::filament
