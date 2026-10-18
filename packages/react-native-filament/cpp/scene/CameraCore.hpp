#pragma once

#include "LookAt.hpp"
#include "engine/EngineCore.hpp"
#include "resources/Resource.hpp"
#include "resources/Users.hpp"

#include <filament/Camera.h>
#include <utils/Entity.h>

#include <memory>

namespace margelo::nitro::filament {

class ManipulatorCore;
class ViewHost;

class CameraCore final : public Resource {
public:
  explicit CameraCore(std::shared_ptr<EngineCore> engine);
  ~CameraCore() override;

  utils::Entity entity() const;
  ::filament::Camera& camera();
  Users<ViewHost>& users();
  void lookAt(const LookAt& pose);
  void followManipulator(const std::shared_ptr<ManipulatorCore>& manipulator);

protected:
  void destroyNative() override;

private:
  std::shared_ptr<EngineCore> engine_;
  utils::Entity entity_;
  ::filament::Camera* camera_;
  Users<ViewHost> users_;
  std::shared_ptr<ManipulatorCore> manipulator_;
};

} // namespace margelo::nitro::filament
