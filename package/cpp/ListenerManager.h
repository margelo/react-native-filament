//
// Created by Marc Rousavy on 24.02.24.
//

#pragma once

#include "Listener.h"
#include <algorithm>
#include <functional>
#include <list>

namespace margelo {

template <typename Callback> class ListenerManager {
private:
  std::list<Callback> _listeners;

public:
  Listener add(Callback listener) {
    _listeners.push_back(std::move(listener));
    auto id = --_listeners.end();
    return Listener([id, this]() { _listeners.erase(id); });
  }

  const std::list<Callback>& getListeners() {
    return _listeners;
  }
};

} // namespace margelo
