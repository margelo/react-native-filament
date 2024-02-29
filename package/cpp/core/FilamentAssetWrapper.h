#pragma once

#include "jsi/HybridObject.h"
#include <gltfio/FilamentAsset.h>
#include <filament/TransformManager.h>

namespace margelo {

using namespace filament;

class FilamentAssetWrapper : public HybridObject {
public:
  explicit FilamentAssetWrapper(std::shared_ptr<gltfio::FilamentAsset> asset) : _asset(asset) {}

  void loadHybridMethods() override;

  void transformToUnitCube(TransformManager& transformManager);

private:
  std::shared_ptr<gltfio::FilamentAsset> _asset;
};

} // namespace margelo
