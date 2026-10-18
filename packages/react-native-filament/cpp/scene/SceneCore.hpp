#pragma once

#include "IndirectLightCore.hpp"
#include "SkyboxCore.hpp"
#include "engine/EngineCore.hpp"
#include "resources/Resource.hpp"
#include "resources/Users.hpp"

#include <filament/Scene.h>

#include <memory>
#include <vector>

namespace margelo::nitro::filament {

class ModelCore;
class ViewHost;

class SceneCore final : public Resource {
public:
  explicit SceneCore(std::shared_ptr<EngineCore> engine);
  ~SceneCore() override;

  ::filament::Scene& scene();
  void addModel(const std::shared_ptr<ModelCore>& model);
  void removeModel(const std::shared_ptr<ModelCore>& model);
  void setIndirectLight(const std::shared_ptr<IndirectLightCore>& light);
  void setSkybox(const std::shared_ptr<SkyboxCore>& skybox);
  Users<ViewHost>& users();

protected:
  void destroyNative() override;

private:
  std::shared_ptr<SceneCore> self();

  std::shared_ptr<EngineCore> engine_;
  ::filament::Scene* scene_;
  std::vector<std::shared_ptr<ModelCore>> models_;
  std::shared_ptr<IndirectLightCore> indirectLight_;
  std::shared_ptr<SkyboxCore> skybox_;
  Users<ViewHost> users_;
};

} // namespace margelo::nitro::filament
