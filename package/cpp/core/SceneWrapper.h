#pragma once

#include "core/utils/EntityWrapper.h"
#include "jsi/HybridObject.h"

#include <filament/Scene.h>
#include <utils/Entity.h>

namespace margelo {
using namespace filament;

class SceneWrapper : public HybridObject {
public:
  explicit SceneWrapper(const std::shared_ptr<Scene>& scene) : _scene(std::move(scene)) {}

  void loadHybridMethods() override;

  std::shared_ptr<Scene> getScene() {
    return _scene;
  }

private:
  std::shared_ptr<Scene> _scene;

private:
  void addEntity(std::shared_ptr<EntityWrapper> entity);
};
} // namespace margelo