#pragma once

#include "DirectionalLightOptions.hpp"
#include "engine/EngineCore.hpp"
#include "resources/Resource.hpp"

#include <utils/Entity.h>

#include <memory>

namespace margelo::nitro::filament {

class LightCore final : public Resource {
public:
  static std::shared_ptr<LightCore> createDirectional(std::shared_ptr<EngineCore> engine, const DirectionalLightOptions& options);

  LightCore(std::shared_ptr<EngineCore> engine, utils::Entity entity);
  ~LightCore() override;

  utils::Entity entity() const;

protected:
  void destroyNative() override;

private:
  static void destroyEntity(EngineCore& engine, utils::Entity entity);

  std::shared_ptr<EngineCore> engine_;
  const utils::Entity entity_;
};

} // namespace margelo::nitro::filament
