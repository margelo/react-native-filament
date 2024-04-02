#include "RendererWrapper.h"

namespace margelo {
using namespace filament;

RendererWrapper::RendererWrapper(const std::shared_ptr<Renderer>& renderer) : HybridObject("RendererWrapper"), _renderer(renderer) {
  // Support translucent views
  // TODO: make this configurable in the future
  _renderer->setClearOptions({.clear = true});
}

void RendererWrapper::loadHybridMethods() {
  registerHybridMethod("beginFrame", &RendererWrapper::beginFrame, this);
  registerHybridMethod("render", &RendererWrapper::render, this);
  registerHybridMethod("endFrame", &RendererWrapper::endFrame, this);
}

bool RendererWrapper::beginFrame(const std::shared_ptr<SwapChainWrapper>& swapChainWrapper, double frameTimeNanos) {
  SwapChain* swapChainPtr = swapChainWrapper->getSwapChain().get();
  return _renderer->beginFrame(swapChainPtr, frameTimeNanos);
}

void RendererWrapper::render(const std::shared_ptr<ViewWrapper>& view) {
  View* viewPtr = view->getView().get();
  _renderer->render(viewPtr);
}

void RendererWrapper::endFrame() {
  _renderer->endFrame();
}

} // namespace margelo
