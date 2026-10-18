#pragma once

#include "engine/EngineCore.hpp"
#include "resources/Resource.hpp"
#include "resources/Users.hpp"

#include <filament/Skybox.h>
#include <filament/Texture.h>

#include <array>
#include <memory>

namespace margelo::nitro::filament {

class SceneCore;

class SkyboxCore final : public Resource {
public:
  SkyboxCore(std::shared_ptr<EngineCore> engine, std::array<float, 4> color);
  SkyboxCore(std::shared_ptr<EngineCore> engine, ::filament::Texture* environment);
  ~SkyboxCore() override;

  ::filament::Skybox* skybox() const;
  Users<SceneCore>& users();
  size_t byteSize() const;

protected:
  void destroyNative() override;

private:
  std::shared_ptr<EngineCore> engine_;
  ::filament::Skybox* skybox_;
  ::filament::Texture* environment_ = nullptr;
  size_t byteSize_ = 0;
  Users<SceneCore> users_;
};

} // namespace margelo::nitro::filament
