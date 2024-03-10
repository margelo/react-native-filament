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

template <typename Callback> class ListenerManager {
private:
  std::shared_ptr<std::list<Callback>> _listeners = std::make_shared<std::list<Callback>>();

public:
  std::shared_ptr<Listener> add(Callback listener) {
    _listeners->push_back(std::move(listener));
    auto id = --_listeners->end();
    auto listeners = _listeners;
    return std::make_shared<Listener>([id, listeners] { listeners->erase(id); });
  }

  const std::list<Callback>& getListeners() {
    return *_listeners;
  }
};

} // namespace margelo
