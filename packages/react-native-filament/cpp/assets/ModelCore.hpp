#pragma once

#include "ModelSnapshot.hpp"
#include "engine/EngineCore.hpp"
#include "resources/Resource.hpp"
#include "resources/Users.hpp"

#include <gltfio/FilamentAsset.h>
#include <gltfio/FilamentInstance.h>

#include <memory>

namespace margelo::nitro::filament {

class SceneCore;

class ModelCore final : public Resource {
public:
  ModelCore(std::shared_ptr<EngineCore> engine, ::filament::gltfio::FilamentAsset* asset);
  ~ModelCore() override;

  const std::shared_ptr<EngineCore>& engine() const;
  ::filament::gltfio::FilamentAsset& asset();
  ::filament::gltfio::FilamentInstance& instance(size_t index);
  const ModelSnapshot& snapshot() const;
  Users<SceneCore>& users();

protected:
  void destroyNative() override;

private:
  std::shared_ptr<EngineCore> engine_;
  ::filament::gltfio::FilamentAsset* asset_;
  const ModelSnapshot snapshot_;
  Users<SceneCore> users_;
};

} // namespace margelo::nitro::filament
