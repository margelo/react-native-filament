//
// Created by Marc Rousavy on 20.02.24.
//

#pragma once

#include <jsi/jsi.h>

#include <string>
#include <vector>
#include "SurfaceProvider.h"

namespace margelo {

using namespace facebook;

class FilamentView {
public:
  virtual ~FilamentView() = 0;

public:
  virtual std::shared_ptr<SurfaceProvider> getSurfaceProvider() = 0;
};

} // namespace margelo
