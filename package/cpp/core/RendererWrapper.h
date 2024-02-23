#pragma once

#include "jsi/HybridObject.h"
#include <filament/Renderer.h>

namespace margelo {

using namespace filament;

class RendererWrapper : public HybridObject {
public:
  explicit RendererWrapper(const std::shared_ptr<Renderer>& renderer);

  void loadHybridMethods() override;

private:
  std::shared_ptr<Renderer> _renderer;
};

} // namespace margelo