#pragma once

#include "jsi/HybridObject.h"

#include <filament/Scene.h>

namespace margelo {
using namespace filament;

class SceneWrapper : public HybridObject {
public:
  explicit SceneWrapper(Scene* scene) : _scene(scene) {}
  ~SceneWrapper();

  void loadHybridMethods() override;

  Scene* _scene;
};
} // namespace margelo