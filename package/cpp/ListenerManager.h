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
  using TSelf = ListenerManager<Callback>;
  std::list<Callback> _listeners;

private:
  std::shared_ptr<TSelf> shared() {
    return this->shared_from_this();
  }

public:
  Listener add(Callback listener) {
    _listeners.push_back(std::move(listener));
      // TODO(Marc): fix this to not cause a bad_weak_ptr
//    auto id = --_listeners.end();
//    auto weakThis = std::weak_ptr<TSelf>(shared());
    return Listener([]() {
//      auto sharedThis = weakThis.lock();
//      if (sharedThis) {
//        sharedThis->_listeners.erase(id);
//      }
    });
  }

  const std::list<Callback>& getListeners() {
    return _listeners;
  }
};

} // namespace margelo
