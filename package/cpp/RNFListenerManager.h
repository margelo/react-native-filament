//
// Created by Marc Rousavy on 24.02.24.
//

#pragma once

#include "RNFListener.h"
#include <algorithm>
#include <atomic>
#include <functional>
#include <list>
#include <memory>
#include <mutex>

namespace margelo {

template <typename Callback> class ListenerManager : public std::enable_shared_from_this<ListenerManager<Callback>> {
private:
  std::list<Callback> _listeners;
  // recursive mutex allows listeners to be removed within their actual callback.
  std::recursive_mutex _mutex;
  // this holds the amount of listeners that were just removed.
  // this is used to allow listeners to be "automagically" removed within the forEach loop.
  std::atomic_size_t _removedListenersCount;

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

    auto weakThis = std::weak_ptr<ListenerManager<Callback>>(shared());
    return Listener::create([id, weakThis] {
      auto sharedThis = weakThis.lock();
      if (sharedThis) {
        std::unique_lock lock(sharedThis->_mutex);
        sharedThis->_listeners.erase(id);
        sharedThis->_removedListenersCount++;
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

    _removedListenersCount = 0;
    for (auto iterator = _listeners.begin(); iterator != _listeners.end(); /* increment done manually */) {
      const auto& listener = *iterator;
      callback(listener);

      if (_removedListenersCount > 0) {
        // do not increment iterator as one (or more) Listeners were just removed.
        _removedListenersCount--;
      } else {
        // no Listeners were removed, we go to the next item in the list
        iterator++;
      }
    }
  }

  bool getHasListeners() {
    std::unique_lock lock(_mutex);

    return _listeners.size() > 0;
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
