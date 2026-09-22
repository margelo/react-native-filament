//
// Created by Hanno Gödecke on 26.03.24.
//

#pragma once

#include "RNFAABBWrapper.h"
#include "RNFNameComponentManagerWrapper.h"
#include "jsi/RNFHybridObject.h"
#include "utils/RNFEntityWrapper.h"

#include <gltfio/FilamentAsset.h>
#include <gltfio/FilamentInstance.h>

namespace margelo {

using namespace filament;
using namespace gltfio;

class AnimatorWrapper;

class FilamentInstanceWrapper : public HybridObject {
public:
  /**
   * `instance` is owned by `asset`; the wrapper keeps the asset alive for as long as it is used.
   */
  explicit FilamentInstanceWrapper(FilamentInstance* instance, std::shared_ptr<gltfio::FilamentAsset> asset)
      : HybridObject("FilamentInstanceWrapper"), _instance(instance), _asset(std::move(asset)) {}

  void loadHybridMethods() override;

  // Internal only
  FilamentInstance* getInstance() {
    return _instance;
  }

private: // Public JS API
  int getEntityCount();
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
  std::shared_ptr<AnimatorWrapper> createAnimator(std::shared_ptr<NameComponentManagerWrapper> nameComponentManager);
  std::shared_ptr<AABBWrapper> getBoundingBox();

private:
  FilamentInstance* _instance;
  std::shared_ptr<gltfio::FilamentAsset> _asset;
};
} // namespace margelo
