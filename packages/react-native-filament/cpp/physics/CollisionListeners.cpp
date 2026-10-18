#include "CollisionListeners.hpp"

#include "utils/Logger.hpp"

#include <algorithm>

namespace margelo::nitro::filament {

std::shared_ptr<CollisionListeners::Entry> CollisionListeners::add(Callback callback) {
  auto entry = std::make_shared<Entry>(std::move(callback));
  entries_.push_back(entry);
  return entry;
}

bool CollisionListeners::empty() {
  std::erase_if(entries_, [](const std::shared_ptr<Entry>& entry) { return entry->removed.load(); });
  return entries_.empty();
}

void CollisionListeners::dispatch(const std::vector<ContactChange>& changes, const worklets::WorkletRuntime& runtime) {
  std::vector<std::shared_ptr<Entry>> snapshot = entries_;
  runtime.runSync([&](jsi::Runtime&) {
    for (const std::shared_ptr<Entry>& entry : snapshot) {
      if (entry->removed) {
        continue;
      }
      try {
        if (!entry->callback(changes)) {
          entry->removed = true;
        }
      } catch (const std::exception& error) {
        logError(std::string("A collision listener threw: ") + error.what());
      }
    }
  });
}

void CollisionListeners::clear() {
  entries_.clear();
}

} // namespace margelo::nitro::filament
