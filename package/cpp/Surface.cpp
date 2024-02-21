//
// Created by Marc Rousavy on 20.02.24.
//
#include "Surface.h"

namespace margelo {

void Surface::loadHybridMethods() {
    registerHybridMethod("getWidth", &Surface::getWidth, this);
    registerHybridMethod("getHeight", &Surface::getHeight, this);
}

} // namespace margelo

