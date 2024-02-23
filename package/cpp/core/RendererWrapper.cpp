#include "RendererWrapper.h"

namespace margelo {
using namespace filament;

RendererWrapper::RendererWrapper(const std::shared_ptr<Renderer>& renderer) : _renderer(renderer) {
  // Support translucent views
  // TODO: make this configurable in the future
  _renderer->setClearOptions({.clear = true});
}

void RendererWrapper::loadHybridMethods() {}
} // namespace margelo