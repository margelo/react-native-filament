#pragma once

#include <functional>
#include <memory>
#include <mutex>
#include <vector>

namespace margelo::nitro::filament {

template <typename... Args> class ListenerRegistry final {
public:
  using Listener = std::function<void(Args...)>;

  std::function<void()> add(Listener listener) {
    auto entry = std::make_shared<Listener>(std::move(listener));
    {
      std::unique_lock lock(state_->mutex);
      state_->entries.push_back(entry);
    }
    return [weakState = std::weak_ptr<State>(state_), weakEntry = std::weak_ptr<Listener>(entry)] {
      std::shared_ptr<State> state = weakState.lock();
      std::shared_ptr<Listener> target = weakEntry.lock();
      if (state == nullptr || target == nullptr) {
        return;
      }
      std::unique_lock lock(state->mutex);
      std::erase(state->entries, target);
    };
  }

  void emit(Args... args) {
    std::vector<std::shared_ptr<Listener>> snapshot;
    {
      std::unique_lock lock(state_->mutex);
      snapshot = state_->entries;
    }
    for (const std::shared_ptr<Listener>& listener : snapshot) {
      (*listener)(args...);
    }
  }

  void clear() {
    std::vector<std::shared_ptr<Listener>> removed;
    std::unique_lock lock(state_->mutex);
    removed.swap(state_->entries);
  }

private:
  struct State {
    std::mutex mutex;
    std::vector<std::shared_ptr<Listener>> entries;
  };

  std::shared_ptr<State> state_ = std::make_shared<State>();
};

} // namespace margelo::nitro::filament
