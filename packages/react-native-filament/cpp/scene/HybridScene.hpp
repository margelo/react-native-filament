#pragma once

#include "HybridSceneSpec.hpp"
#include "SceneCore.hpp"

#include <memory>

namespace margelo::nitro::filament {

class HybridEngine;

class HybridScene final : public HybridSceneSpec {
public:
  HybridScene(std::shared_ptr<HybridEngine> engine, std::shared_ptr<SceneCore> core);

  double getEntityCount() override;
  void addEntity(double entity) override;
  void removeEntity(double entity) override;
  void setSkybox(const std::optional<std::shared_ptr<HybridSkyboxSpec>>& skybox) override;
  void dispose() override;

  const std::shared_ptr<EngineCore>& engineCore() const;
  const std::shared_ptr<SceneCore>& core() const;

private:
  void requireUsable(const char* method) const;

  std::shared_ptr<HybridEngine> engine_;
  std::shared_ptr<SceneCore> core_;
};

} // namespace margelo::nitro::filament
