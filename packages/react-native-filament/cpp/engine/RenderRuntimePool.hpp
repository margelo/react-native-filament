#pragma once

#include <worklets/WorkletRuntime/WorkletRuntime.h>

#include <memory>
#include <mutex>
#include <optional>
#include <vector>

namespace margelo::nitro::filament {

class RenderThreadQueue;

/**
 * Render worklet runtimes of finished Engines, reused by later Engines of the same JS runtime
 * instead of being destroyed (D35).
 */
class RenderRuntimePool final {
public:
  struct Entry {
    std::shared_ptr<RenderThreadQueue> queue;
    std::shared_ptr<worklets::WorkletRuntime> runtime;
  };

  std::optional<Entry> acquire();
  void release(Entry entry);

private:
  std::mutex mutex_;
  std::vector<Entry> idle_;
};

} // namespace margelo::nitro::filament
