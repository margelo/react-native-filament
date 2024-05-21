#pragma once

#include "jsi/RNFHybridObject.h"

#include <camutils/Manipulator.h>

namespace margelo {
using namespace filament;
using namespace camutils;

class ManipulatorWrapper : public HybridObject {
public:
  explicit ManipulatorWrapper(std::shared_ptr<Manipulator<float>> manipulator)
      : HybridObject("ManipulatorWrapper"), _manipulator(manipulator) {}

  void loadHybridMethods() override;

  std::shared_ptr<Manipulator<float>> getManipulator() {
    return _manipulator;
  }

private:
  std::shared_ptr<Manipulator<float>> _manipulator;
};
} // namespace margelo
