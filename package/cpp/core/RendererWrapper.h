#pragma once

#include "jsi/HybridObject.h"
#include <filament/Renderer.h>

namespace margelo {

using namespace filament;

class RendererWrapper : public HybridObject {
public:
  explicit RendererWrapper(Renderer* renderer);
  ~RendererWrapper();

  void loadHybridMethods() override;

private:
  Renderer* _renderer;
};

} // namespace margelo