#pragma once

#include "resources/Resource.hpp"

#include <filament/Engine.h>
#include <filament/Renderer.h>
#include <filament/Scene.h>
#include <filament/View.h>
#include <math/vec2.h>
#include <math/vec3.h>
#include <utils/Entity.h>

#include <array>
#include <memory>

namespace margelo::nitro::filament {

class CameraCore;
class SceneCore;

class ViewHost : public Resource {
public:
  struct ClearSettings {
    std::array<float, 4> color;
    bool clear;
    bool discard;
  };

  void setScene(const std::shared_ptr<SceneCore>& scene);
  void setCamera(const std::shared_ptr<CameraCore>& camera);
  void setClearOptions(ClearSettings clear);
  ::filament::View& view();
  ::filament::math::float2 projectWorldToPoints(::filament::math::float3 position) const;

protected:
  ViewHost(const char* kind, ::filament::Engine& engine, ClearSettings clear);
  void destroyViewHost();
  virtual double pointsPerPixel() const;

  ::filament::Engine& engine_;
  ::filament::Renderer* renderer_;
  ::filament::View* view_;

private:
  ::filament::Scene* emptyScene_;
  utils::Entity defaultCameraEntity_;
  std::shared_ptr<SceneCore> scene_;
  std::shared_ptr<CameraCore> camera_;
};

} // namespace margelo::nitro::filament
