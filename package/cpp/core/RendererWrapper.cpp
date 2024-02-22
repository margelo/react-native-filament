#include "RendererWrapper.h"


namespace margelo {
    void RendererWrapper::loadHybridMethods() {
        registerHybridMethod("render", &_renderer->render, _renderer);
    }
} // namespace margelo
