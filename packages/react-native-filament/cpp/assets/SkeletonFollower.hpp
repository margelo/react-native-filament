#pragma once

#include <filament/TransformManager.h>
#include <utils/Entity.h>

#include <atomic>
#include <memory>
#include <utility>
#include <vector>

namespace margelo::nitro::filament {

class ModelCore;

class SkeletonFollower final {
public:
  SkeletonFollower(std::shared_ptr<ModelCore> source, size_t sourceIndex, std::shared_ptr<ModelCore> target, size_t targetIndex);

  void apply(::filament::TransformManager& transforms);
  void stop();
  bool isStopped() const;

private:
  std::shared_ptr<ModelCore> source_;
  std::shared_ptr<ModelCore> target_;
  size_t targetIndex_;
  std::vector<std::pair<utils::Entity, utils::Entity>> joints_;
  std::atomic<bool> stopped_{false};
};

} // namespace margelo::nitro::filament
