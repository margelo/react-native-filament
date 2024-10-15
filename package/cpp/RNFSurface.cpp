//
// Created by Marc Rousavy on 20.02.24.
//
#include "RNFSurface.h"

namespace margelo {

void Surface::loadHybridMethods() {
  HybridObject::loadHybridMethods();
  registerHybrids(this, [](nitro::Prototype& proto) {
    proto.registerHybridGetter("width", &Surface::getWidth);
    proto.registerHybridGetter("height", &Surface::getHeight);
  });
}

} // namespace margelo
