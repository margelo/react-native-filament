//
// Created by Marc Rousavy on 21.02.24.
//

#include "Listener.h"

namespace margelo {

Listener::Listener(std::function<void()> remove) : _remove(std::move(remove)), _isRemoved(false) {}

void Listener::remove() {
  if (_isRemoved) {
    return;
  }
  _remove();
  _isRemoved = true;
}

} // namespace margelo