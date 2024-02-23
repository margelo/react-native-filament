#include "RendererWrapper.h"

margelo::RendererWrapper::RendererWrapper(filament::Renderer* renderer) : _renderer(renderer) {
  // Support translucent views
  // TODO: make this configurable in the future
  _renderer->setClearOptions({.clear = true});
}
margelo::RendererWrapper::~RendererWrapper() {
  _renderer = nullptr;
}

void margelo::RendererWrapper::loadHybridMethods() {}
