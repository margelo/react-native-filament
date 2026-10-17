#pragma once

#include <functional>
#include <memory>
#include <mutex>
#include <vector>

namespace margelo::nitro::filament {

class OnceEvent final {
public:
  std::function<void()> add(std::function<void()> listener) {
    auto entry = std::make_shared<std::function<void()>>(std::move(listener));
    {
      std::unique_lock lock(state_->mutex);
      if (!state_->fired) {
        state_->listeners.push_back(entry);
        return [weakState = std::weak_ptr<State>(state_), weakEntry = std::weak_ptr<std::function<void()>>(entry)] {
          std::shared_ptr<State> state = weakState.lock();
          std::shared_ptr<std::function<void()>> target = weakEntry.lock();
          if (state == nullptr || target == nullptr) {
            return;
          }
          std::unique_lock lock(state->mutex);
          std::erase(state->listeners, target);
        };
      }
    }
    (*entry)();
    return [] {};
  }

  void fire() {
    std::vector<std::shared_ptr<std::function<void()>>> listeners;
    {
      std::unique_lock lock(state_->mutex);
      if (state_->fired) {
        return;
      }
      state_->fired = true;
      listeners.swap(state_->listeners);
    }
    for (const auto& listener : listeners) {
      (*listener)();
    }
  }

  void clear() {
    std::vector<std::shared_ptr<std::function<void()>>> removed;
    std::unique_lock lock(state_->mutex);
    removed.swap(state_->listeners);
  }

private:
  struct State {
    std::mutex mutex;
    bool fired = false;
    std::vector<std::shared_ptr<std::function<void()>>> listeners;
  };

  std::shared_ptr<State> state_ = std::make_shared<State>();
};

} // namespace margelo::nitro::filament
