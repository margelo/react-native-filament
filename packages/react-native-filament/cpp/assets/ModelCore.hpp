#pragma once

#include "ModelSnapshot.hpp"
#include "engine/EngineCore.hpp"
#include "resources/Resource.hpp"
#include "resources/Users.hpp"

#include <gltfio/FilamentAsset.h>
#include <gltfio/FilamentInstance.h>

#include <memory>
#include <mutex>
#include <unordered_map>
#include <vector>

namespace margelo::nitro::filament {

class SceneCore;
class SkeletonFollower;

class ModelCore final : public Resource {
public:
  ModelCore(std::shared_ptr<EngineCore> engine, ::filament::gltfio::FilamentAsset* asset, size_t sourceBytes);
  ~ModelCore() override;

  const std::shared_ptr<EngineCore>& engine() const;
  ::filament::gltfio::FilamentAsset& asset();
  ::filament::gltfio::FilamentInstance& instance(size_t index);
  const ModelSnapshot& snapshot() const;
  std::vector<double> entities() const;
  size_t instanceCount() const;
  std::shared_ptr<const ModelInstanceSnapshot> instanceSnapshot(size_t index) const;
  size_t createInstance();
  void setSkeletonFollower(size_t instanceIndex, std::shared_ptr<SkeletonFollower> follower);
  Users<SceneCore>& users();
  size_t byteSize() const;

protected:
  void destroyNative() override;

private:
  std::shared_ptr<EngineCore> engine_;
  ::filament::gltfio::FilamentAsset* asset_;
  const ModelSnapshot snapshot_;
  const size_t sourceBytes_;
  mutable std::mutex instancesMutex_;
  std::vector<double> entities_;
  std::vector<std::shared_ptr<const ModelInstanceSnapshot>> instances_;
  std::unordered_map<size_t, std::shared_ptr<SkeletonFollower>> skeletonFollowers_;
  Users<SceneCore> users_;
};

} // namespace margelo::nitro::filament
