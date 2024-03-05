//
// Created by Marc Rousavy on 20.02.24.
//

#pragma once

#include <jsi/jsi.h>

#include "SurfaceProvider.h"
#include "jsi/HybridObject.h"
#include <string>
#include <vector>

namespace margelo {

using namespace facebook;

class FilamentView : public HybridObject {
public:
  virtual std::shared_ptr<SurfaceProvider> getSurfaceProvider() = 0;

  void loadHybridMethods() override;

private:
  const char* getName() override { return "FilamentView"; }
};

} // namespace margelo
