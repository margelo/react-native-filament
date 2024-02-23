#pragma once

#include "core/utils/EntityWrapper.h"
#include "jsi/HybridObject.h"

#include <filament/Scene.h>
#include <utils/Entity.h>

namespace margelo {
using namespace filament;

class SceneWrapper : public HybridObject {
public:
  explicit SceneWrapper(Scene* scene) : _scene(scene) {}
  ~SceneWrapper();

  void loadHybridMethods() override;

  Scene* _scene;

private:
  void addEntity(std::shared_ptr<EntityWrapper> entity);
};
} // namespace margelo