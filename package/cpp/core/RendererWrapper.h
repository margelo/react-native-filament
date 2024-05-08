//
// Created by Hanno Gödecke on 24.04.24.
//

#pragma once

#include "jsi/PointerHolder.h"
#include <filament/Renderer.h>

namespace margelo {

using namespace filament;

class RendererWrapper : public PointerHolder<Renderer> {
public:
  explicit RendererWrapper(std::shared_ptr<Renderer> renderer) : PointerHolder("RendererWrapper", renderer) {}

  void loadHybridMethods() override;

private: // Public JS API
  void setFrameRateOptions(std::unordered_map<std::string, double> options);
  void setPresentationTime(int64_t timestamp);

  /**
   * Whether the SwapChain should be cleared using the clearColor. Use this if translucent
   * View will be drawn, for instance.
   * @default true
   */
  void setClearContent(bool shouldClear);
};

} // namespace margelo
