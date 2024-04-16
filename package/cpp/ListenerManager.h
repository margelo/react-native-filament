//
// Created by Marc Rousavy on 24.02.24.
//

#pragma once

#include "Listener.h"
#include <algorithm>
#include <functional>
#include <list>
#include <memory>
#include <mutex>

namespace margelo {

template <typename Callback> class ListenerManager : public std::enable_shared_from_this<ListenerManager<Callback>> {
private:
  std::list<Callback> _listeners;
  std::mutex _mutex;

public:
  std::shared_ptr<Listener> add(Callback listener) {
    std::unique_lock lock(_mutex);

    _listeners.push_back(std::move(listener));
    auto id = --_listeners.end();

    auto weakThis = std::weak_ptr<ListenerManager<Callback>>(shared());
    return Listener::create([id, weakThis] {
      auto sharedThis = weakThis.lock();
      if (sharedThis) {
        std::unique_lock lock(sharedThis->_mutex);
        sharedThis->_listeners.erase(id);
      }
    });
  }

  void forEach(const std::function<void(const Callback&)>& callback) {
    std::unique_lock lock(_mutex);

    for (const auto& listener : _listeners) {
      callback(listener);
    }
  }

private:
  explicit ListenerManager() {}

  std::shared_ptr<ListenerManager<Callback>> shared() {
    return this->shared_from_this();
  }

public:
  static std::shared_ptr<ListenerManager<Callback>> create() {
    return std::shared_ptr<ListenerManager<Callback>>(new ListenerManager());
  }
};

} // namespace margelo
