#pragma once

#include "engine/EngineCore.hpp"
#include "resources/Resource.hpp"
#include "resources/Users.hpp"

#include <filament/Camera.h>
#include <utils/Entity.h>

#include <memory>

namespace margelo::nitro::filament {

class ViewTargetCore;

class CameraCore final : public Resource {
public:
  explicit CameraCore(std::shared_ptr<EngineCore> engine);
  ~CameraCore() override;

  utils::Entity entity() const;
  ::filament::Camera& camera();
  Users<ViewTargetCore>& users();

protected:
  void destroyNative() override;

private:
  std::shared_ptr<EngineCore> engine_;
  utils::Entity entity_;
  ::filament::Camera* camera_;
  Users<ViewTargetCore> users_;
};

} // namespace margelo::nitro::filament
