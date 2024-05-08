//
// Created by Hanno Gödecke on 24.04.24.
//

#pragma once

#include "SwapChainWrapper.h"
#include "ViewWrapper.h"
#include "jsi/PointerHolder.h"
#include <filament/Renderer.h>

namespace margelo {

using namespace filament;

class RendererWrapper : public PointerHolder<Renderer> {
public:
  explicit RendererWrapper(std::shared_ptr<Renderer> renderer) : PointerHolder("RendererWrapper", renderer) {}

  void loadHybridMethods() override;

private: // Exposed JS API
  void setFrameRateOptions(std::unordered_map<std::string, double> options);
  void setPresentationTime(int64_t timestamp);

  /**
   * Whether the SwapChain should be cleared using the clearColor. Use this if translucent
   * View will be drawn, for instance.
   * @default true
   */
  void setClearContent(bool shouldClear);

  bool beginFrame(std::shared_ptr<SwapChainWrapper> swapChainWrapper, double timestamp);
  void render(std::shared_ptr<ViewWrapper> viewWrapper);
  void endFrame();
};

} // namespace margelo
