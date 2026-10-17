#pragma once

#include "engine/EngineCore.hpp"
#include "resources/Resource.hpp"
#include "resources/Users.hpp"

#include <filament/Skybox.h>

#include <array>
#include <memory>

namespace margelo::nitro::filament {

class SceneCore;

class SkyboxCore final : public Resource {
public:
  SkyboxCore(std::shared_ptr<EngineCore> engine, std::array<float, 4> color);
  ~SkyboxCore() override;

  ::filament::Skybox* skybox() const;
  Users<SceneCore>& users();

protected:
  void destroyNative() override;

private:
  std::shared_ptr<EngineCore> engine_;
  ::filament::Skybox* skybox_;
  Users<SceneCore> users_;
};

} // namespace margelo::nitro::filament
