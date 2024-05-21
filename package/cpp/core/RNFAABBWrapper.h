//
// Created by Hanno Gödecke on 18.03.24.
//

#pragma once

#include <filament/Box.h>
#include <jsi/RNFHybridObject.h>

namespace margelo {

using namespace filament;

class AABBWrapper : public HybridObject {
public:
  explicit AABBWrapper(const Aabb& aabb) : HybridObject("AABBWrapper"), _aabb(aabb) {}
  void loadHybridMethods() override;

private: // Exposed JS api
  std::vector<double> getCenter();
  std::vector<double> getHalfExtent();
  std::vector<double> getMin();
  std::vector<double> getMax();

private:
  Aabb _aabb;
};

} // namespace margelo
