//
// Created by Marc Rousavy on 21.02.24.
//

#include "Listener.h"
#include "Logger.h"

namespace margelo {

Listener::Listener(ListenerRemover&& remove) : HybridObject(TAG), _remove(std::move(remove)), _isRemoved(false) {
  Logger::log(TAG, "Creating Listener...");
}

Listener::~Listener() {
  Logger::log(TAG, "Destroying Listener...");
  remove();
}

void Listener::loadHybridMethods() {
  registerHybridMethod("remove", &Listener::remove, this);
}

void Listener::remove() {
  if (_isRemoved) {
    return;
  }
  _remove();
  _isRemoved = true;
}

std::shared_ptr<Listener> Listener::create(ListenerRemover&& remover) {
  return std::shared_ptr<Listener>(new Listener(std::move(remover)));
}

} // namespace margelo
