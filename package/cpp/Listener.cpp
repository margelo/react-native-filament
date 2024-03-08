//
// Created by Marc Rousavy on 21.02.24.
//

#include "Listener.h"

namespace margelo {

Listener::Listener(const std::function<void()>& remove) : HybridObject("Listener"), _remove(remove), _isRemoved(false) {}

Listener::~Listener() {
  remove();
}

void Listener::remove() {
  if (_isRemoved) {
    return;
  }
  _remove();
  _isRemoved = true;
}

void Listener::loadHybridMethods() {
  registerHybridMethod("remove", &Listener::remove, this);
}

} // namespace margelo
