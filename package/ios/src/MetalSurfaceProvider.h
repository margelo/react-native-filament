//
//  MetalSurfaceProvider.h
//  Pods
//
//  Created by Marc Rousavy on 22.02.24.
//

#pragma once

#include "MetalSurface.h"
#include "SurfaceProvider.h"
#include <Metal/Metal.h>

namespace margelo {

class MetalSurfaceProvider : public SurfaceProvider {
public:
  explicit MetalSurfaceProvider(CAMetalLayer* layer) : _surface(std::make_shared<MetalSurface>(layer)) {}

  std::shared_ptr<Surface> getSurfaceOrNull() override {
    return _surface;
  }

private:
  std::shared_ptr<MetalSurface> _surface;
};

} // namespace margelo
