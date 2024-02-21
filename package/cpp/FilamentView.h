//
// Created by Marc Rousavy on 20.02.24.
//

#pragma once

#include <jsi/jsi.h>

#include "SurfaceProvider.h"
#include <string>
#include <vector>

namespace margelo {

using namespace facebook;

class FilamentView {
public:
  virtual const SurfaceProvider& getSurfaceProvider() = 0;
};

} // namespace margelo
