//
// Created by Marc Rousavy on 24.02.24.
//

#pragma once

#include "Listener.h"
#include <algorithm>
#include <functional>
#include <list>
#include <memory>

namespace margelo {

template <typename Callback> class ListenerManager : public std::enable_shared_from_this<ListenerManager<Callback>> {
private:
  std::list<Callback> _listeners;

public:
  std::shared_ptr<Listener> add(Callback listener) {
    _listeners.push_back(std::move(listener));
    auto id = --_listeners.end();

    auto weakThis = std::weak_ptr<ListenerManager<Callback>>(shared());
    return Listener::create([id, weakThis] {
      auto sharedThis = weakThis.lock();
      if (sharedThis) {
        sharedThis->_listeners.erase(id);
      }
    });
  }

  const std::list<Callback>& getListeners() {
    return _listeners;
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
