#pragma once

#include "engine/EngineCore.hpp"
#include "resources/Resource.hpp"
#include "resources/Users.hpp"

#include <filament/IndirectLight.h>
#include <filament/Texture.h>

#include <cstdint>
#include <memory>

namespace margelo::nitro::filament {

class SceneCore;

class IndirectLightCore final : public Resource {
public:
  IndirectLightCore(std::shared_ptr<EngineCore> engine, const uint8_t* ktx, size_t size, float intensity);
  ~IndirectLightCore() override;

  ::filament::IndirectLight* indirectLight() const;
  Users<SceneCore>& users();
  size_t byteSize() const;

protected:
  void destroyNative() override;

private:
  std::shared_ptr<EngineCore> engine_;
  ::filament::Texture* reflections_ = nullptr;
  ::filament::IndirectLight* indirectLight_ = nullptr;
  size_t byteSize_ = 0;
  Users<SceneCore> users_;
};

} // namespace margelo::nitro::filament
