//
// Created by Marc Rousavy on 20.02.24.
//

#pragma once

#if __has_include(<NitroModules/HybridObject.hpp>)
#include <NitroModules/HybridObject.hpp>
#else
#error NitroModules cannot be found! Are you sure you installed NitroModules properly?
#endif
#include <string>
#include <vector>

namespace margelo {

class Surface : public nitro::HybridObject {
public:
  explicit Surface() : HybridObject("Surface") {}

public:
  /**
   * Returns the surface ("native window") that can be used as a render target.
   * On Android, this is a `ANativeWindow*`, on iOS it is a `CAMetalLayer*`.
   */
  virtual void* getSurface() = 0;
  /**
   * Gets the width of the Surface.
   */
  virtual int getWidth() = 0;
  /**
   * Gets the height of the Surface.
   */
  virtual int getHeight() = 0;

  void loadHybridMethods() override;
};

} // namespace margelo
