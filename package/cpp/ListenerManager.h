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

  // We use a recursive mutex here, because we might call remove() from within a forEach() block.
  // This happens e.g. when a surface is destroyed and the onDestroy listener is called, which leads
  // to a remove() call on the listener.
  std::recursive_mutex _mutex;

public:
  /**
   * Add a listener to the list.
   * This method is thread-safe.
   * @param listener The listener to add to the list.
   * @return A listener subscription. Upon deleting that, the Listener gets removed,
   * so make sure to keep a strong reference to the subscription in memory.
   */
  std::shared_ptr<Listener> add(Callback listener) {
    std::unique_lock lock(_mutex);

    _listeners.push_back(std::move(listener));
    auto id = --_listeners.end();

    auto weakThis = std::weak_ptr(shared());
    return Listener::create([id, weakThis] {
      auto sharedThis = weakThis.lock();
      if (sharedThis) {
        std::unique_lock lock(sharedThis->_mutex);
        sharedThis->_listeners.erase(id);
      }
    });
  }

  using LoopCallback = void(const Callback&);

  /**
   * Iterate through all listeners.
   * This method is thread-safe.
   * Make sure to not add or delete any listeners while inside a forEach() block,
   * otherwise this could dead-lock.
   * @param callback The callback to run for each listener.
   */
  void forEach(std::function<LoopCallback>&& callback) {
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
