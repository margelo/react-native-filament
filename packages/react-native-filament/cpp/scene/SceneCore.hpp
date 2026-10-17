#pragma once

#include "SkyboxCore.hpp"
#include "engine/EngineCore.hpp"
#include "resources/Resource.hpp"
#include "resources/Users.hpp"

#include <filament/Scene.h>

#include <memory>

namespace margelo::nitro::filament {

class ViewTargetCore;

class SceneCore final : public Resource {
public:
  explicit SceneCore(std::shared_ptr<EngineCore> engine);
  ~SceneCore() override;

  ::filament::Scene& scene();
  void setSkybox(const std::shared_ptr<SkyboxCore>& skybox);
  Users<ViewTargetCore>& users();

protected:
  void destroyNative() override;

private:
  std::shared_ptr<EngineCore> engine_;
  ::filament::Scene* scene_;
  std::shared_ptr<SkyboxCore> skybox_;
  Users<ViewTargetCore> users_;
};

} // namespace margelo::nitro::filament
