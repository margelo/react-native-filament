#pragma once

#include "jsi/HybridObject.h"

#include <camutils/Manipulator.h>

namespace margelo {
using namespace filament;
using namespace camutils;

class ManipulatorWrapper : public HybridObject {
public:
  explicit ManipulatorWrapper(const std::shared_ptr<Manipulator<float>>& manipulator) : _manipulator(manipulator) {}

  void loadHybridMethods() override;

  const std::shared_ptr<Manipulator<float>>& getManipulator() {
    return _manipulator;
  }

private:
  std::shared_ptr<Manipulator<float>> _manipulator;
};
} // namespace margelo