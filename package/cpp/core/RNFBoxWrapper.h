//
// Created by Hanno Gödecke on 18.03.24.
//

#pragma once

#include <filament/Box.h>
#include <jsi/RNFHybridObject.h>

namespace margelo {

using namespace filament;

class BoxWrapper : public HybridObject {
public:
  explicit BoxWrapper(const Box& box) : HybridObject("BoxWrapper"), _box(box) {}
  void loadHybridMethods() override;

private: // Exposed JS api
  std::vector<double> getCenter();
  std::vector<double> getHalfExtent();
  std::vector<double> getMin();
  std::vector<double> getMax();

private:
  Box _box;
};

} // namespace margelo
