#pragma once

#include "GeometryCore.hpp"
#include "HybridRenderableSpec.hpp"

#include <memory>

namespace margelo::nitro::filament {

class HybridEngine;

class HybridRenderable final : public HybridRenderableSpec {
public:
  HybridRenderable(std::shared_ptr<HybridEngine> engine, std::shared_ptr<GeometryCore> core);

  double getEntity() override;
  void dispose() override;

private:
  std::shared_ptr<HybridEngine> engine_;
  std::shared_ptr<GeometryCore> core_;
};

} // namespace margelo::nitro::filament
