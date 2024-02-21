//
// Created by Marc Rousavy on 20.02.24.
//
#include "Surface.h"

namespace margelo {

void Surface::loadHybridMethods() {
    registerHybridGetter("width", &Surface::getWidth, this);
    registerHybridGetter("height", &Surface::getHeight, this);
}

} // namespace margelo

