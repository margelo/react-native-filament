#pragma once

#include "DirectionalLightOptions.hpp"
#include "LightType.hpp"
#include "PointLightOptions.hpp"
#include "SpotLightOptions.hpp"
#include "SunLightOptions.hpp"
#include "engine/EngineCore.hpp"
#include "resources/Resource.hpp"

#include <utils/Entity.h>

#include <memory>

namespace margelo::nitro::filament {

class LightCore final : public Resource {
public:
  static std::shared_ptr<LightCore> createDirectional(std::shared_ptr<EngineCore> engine, const DirectionalLightOptions& options);
  static std::shared_ptr<LightCore> createSun(std::shared_ptr<EngineCore> engine, const SunLightOptions& options);
  static std::shared_ptr<LightCore> createPoint(std::shared_ptr<EngineCore> engine, const PointLightOptions& options);
  static std::shared_ptr<LightCore> createSpot(std::shared_ptr<EngineCore> engine, const SpotLightOptions& options, bool focused);

  LightCore(std::shared_ptr<EngineCore> engine, utils::Entity entity, LightType type);
  ~LightCore() override;

  utils::Entity entity() const;
  LightType type() const;

protected:
  void destroyNative() override;

private:
  static void destroyEntity(EngineCore& engine, utils::Entity entity);

  std::shared_ptr<EngineCore> engine_;
  const utils::Entity entity_;
  const LightType type_;
};

} // namespace margelo::nitro::filament
