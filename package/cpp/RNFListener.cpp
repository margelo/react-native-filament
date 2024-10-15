//
// Created by Marc Rousavy on 21.02.24.
//

#include "RNFListener.h"
#include "RNFLogger.h"

namespace margelo {

Listener::Listener(ListenerRemover&& remove) : HybridObject(TAG), _remove(std::move(remove)), _isRemoved(false) {
  Logger::log(TAG, "Creating Listener...");
}

Listener::~Listener() {
  Logger::log(TAG, "Destroying Listener...");
  remove();
}

void Listener::loadHybridMethods() {
  HybridObject::loadHybridMethods();
  registerHybrids(this, [](nitro::Prototype& proto) { proto.registerHybridMethod("remove", &Listener::remove); });
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
