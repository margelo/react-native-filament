//
// Created by Hanno Gödecke on 26.03.24.
//

#pragma once

#include "AABBWrapper.h"
#include "AnimatorWrapper.h"
#include "jsi/HybridObject.h"
#include "utils/EntityWrapper.h"

#include <gltfio/FilamentInstance.h>

namespace margelo {

using namespace filament;
using namespace gltfio;

class FilamentInstanceWrapper : public HybridObject {
public:
  explicit FilamentInstanceWrapper(FilamentInstance* instance) : HybridObject("FilamentInstanceWrapper"), _instance(instance) {}

  void loadHybridMethods() override;

  // Internal only
  FilamentInstance* getInstance() {
    return _instance;
  }

private: // Public JS API
  std::vector<std::shared_ptr<EntityWrapper>> getEntities();
  std::shared_ptr<EntityWrapper> getRoot();
  /**
   * Returns the animation engine for the instance.
   *
   * Note that an animator can be obtained either from an individual instance, or from the
   * originating FilamentAsset. In the latter case, the animation frame is shared amongst all
   * instances. If individual control is desired, users must obtain the animator from the
   * individual instances.
   */
  std::shared_ptr<AnimatorWrapper> getAnimator();
  std::shared_ptr<AABBWrapper> getBoundingBox();

private:
  FilamentInstance* _instance;
};
} // namespace margelo
