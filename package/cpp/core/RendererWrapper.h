#pragma once

#include "SwapChainWrapper.h"
#include "ViewWrapper.h"
#include "jsi/HybridObject.h"
#include <filament/Renderer.h>

namespace margelo {

using namespace filament;

class RendererWrapper : public HybridObject {
public:
  explicit RendererWrapper(const std::shared_ptr<Renderer>& renderer);

  void loadHybridMethods() override;

  std::shared_ptr<Renderer> getRenderer() {
    return _renderer;
  }

private:
  std::shared_ptr<Renderer> _renderer;

private:
  bool beginFrame(std::shared_ptr<SwapChainWrapper> swapChain, double frameTimeNanos);
  void render(std::shared_ptr<ViewWrapper> view);
  void endFrame();
};

} // namespace margelo
