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

  const std::shared_ptr<Renderer>& getRenderer() {
    return _renderer;
  }

private:
  std::shared_ptr<Renderer> _renderer;

private:
  __attribute__ ((hot)) bool beginFrame(const std::shared_ptr<SwapChainWrapper>& swapChain, double frameTimeNanos);
  __attribute__ ((hot)) void render(const std::shared_ptr<ViewWrapper>& view);
  __attribute__ ((hot)) void endFrame();
};

} // namespace margelo
