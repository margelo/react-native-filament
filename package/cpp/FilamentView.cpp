//
// Created by Marc Rousavy on 20.02.24.
//

#include "FilamentView.h"

namespace margelo {

void FilamentView::loadHybridMethods() {
    registerHybridMethod("getSurfaceProvider", &FilamentView::getSurfaceProvider, this);
}

} // namespace margelo
