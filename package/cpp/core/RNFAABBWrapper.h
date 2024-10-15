//
// Created by Hanno Gödecke on 18.03.24.
//

#pragma once

#include <filament/Box.h>
#if __has_include(<NitroModules/HybridObject.hpp>)
#include <NitroModules/HybridObject.hpp>
#else
#error NitroModules cannot be found! Are you sure you installed NitroModules properly?
#endif

namespace margelo {

using namespace filament;

class AABBWrapper : public nitro::HybridObject {
public:
  explicit AABBWrapper(const Aabb& aabb) : HybridObject("AABBWrapper"), _aabb(aabb) {}
  void loadHybridMethods() override;

  Aabb getAabb() {
    return _aabb;
  }

private: // Exposed JS api
  std::vector<double> getCenter();
  std::vector<double> getHalfExtent();
  std::vector<double> getMin();
  std::vector<double> getMax();

private:
  Aabb _aabb;
};

} // namespace margelo
