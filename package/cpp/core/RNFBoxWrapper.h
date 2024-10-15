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

class BoxWrapper : public nitro::HybridObject {
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
