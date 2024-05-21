#pragma once

#include "jsi/RNFPointerHolder.h"

#include <camutils/Manipulator.h>

namespace margelo {
using namespace filament;
using namespace camutils;

class ManipulatorWrapper : public PointerHolder<Manipulator<float>> {
public:
  explicit ManipulatorWrapper(std::shared_ptr<Manipulator<float>> manipulator) : PointerHolder("ManipulatorWrapper", manipulator) {}

  void loadHybridMethods() override;

  std::shared_ptr<Manipulator<float>> getManipulator() {
    return pointee();
  }

private: // Exposed JS API
  std::vector<std::vector<double>> getLookAt();
  void grabBegin(float x, float y, bool strafe);
  void grabUpdate(float x, float y);
  void grabEnd();
  void scroll(float x, float y, float delta);
  void update(float dt);

private:
  const static constexpr auto TAG = "ManipulatorWrapper";
};
} // namespace margelo
