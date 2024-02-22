//
//  MetalSurface.h
//  Pods
//
//  Created by Marc Rousavy on 22.02.24.
//

#pragma once

#include "Surface.h"
#include <Metal/Metal.h>

namespace margelo {

class MetalSurface: public Surface {
  explicit MetalSurface(CAMetalLayer* layer): _layer(layer) { }
  
  int getWidth() override {
    return static_cast<int>(_layer.drawableSize.width);
  }
  int getHeight() override {
    return static_cast<int>(_layer.drawableSize.height);
  }
  void* getSurface() override {
    return (__bridge void*)_layer;
  }
private:
  CAMetalLayer* _layer;
};

} // namespace margelo
