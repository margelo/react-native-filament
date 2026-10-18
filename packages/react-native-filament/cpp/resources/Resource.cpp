#include "Resource.hpp"

#include <stdexcept>
#include <string>

namespace margelo::nitro::filament {

bool Resource::isLive() const {
  return state_ == State::Live;
}

bool Resource::isDestroyed() const {
  return state_ == State::Destroyed;
}

void Resource::requireLive(const char* method) const {
  if (state_ != State::Live) {
    throw std::runtime_error(std::string("FilamentDisposedError: ") + method + " was called on a disposed " + kind_ + ".");
  }
}

bool Resource::markDisposing() {
  State expected = State::Live;
  if (!state_.compare_exchange_strong(expected, State::Disposing)) {
    return false;
  }
  for (const std::shared_ptr<Resource>& child : liveChildren()) {
    child->markDisposing();
  }
  return true;
}

void Resource::destroyTree() {
  for (const std::shared_ptr<Resource>& child : liveChildren()) {
    child->destroyTree();
  }
  if (state_.exchange(State::Destroyed) != State::Destroyed) {
    destroyNative();
  }
}

void Resource::adopt(const std::shared_ptr<Resource>& child) {
  std::unique_lock lock(childrenMutex_);
  std::erase_if(children_, [](const std::weak_ptr<Resource>& existing) { return existing.expired(); });
  children_.push_back(child);
}

void Resource::countLiveDescendants(std::unordered_map<std::string, double>& counts) {
  for (const std::shared_ptr<Resource>& child : liveChildren()) {
    if (!child->isDestroyed()) {
      counts[child->kind_]++;
      child->countLiveDescendants(counts);
    }
  }
}

std::vector<std::shared_ptr<Resource>> Resource::liveChildren() {
  std::unique_lock lock(childrenMutex_);
  std::vector<std::shared_ptr<Resource>> result;
  for (const std::weak_ptr<Resource>& child : children_) {
    if (std::shared_ptr<Resource> strong = child.lock()) {
      result.push_back(std::move(strong));
    }
  }
  return result;
}

} // namespace margelo::nitro::filament
