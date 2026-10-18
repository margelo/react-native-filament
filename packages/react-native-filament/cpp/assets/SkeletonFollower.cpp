#include "SkeletonFollower.hpp"

#include "ModelCore.hpp"

#include <gltfio/Animator.h>

#include <string>
#include <unordered_map>

namespace margelo::nitro::filament {

namespace {

  std::unordered_map<std::string, utils::Entity> jointsByName(ModelCore& model, size_t instanceIndex) {
    ::filament::gltfio::FilamentInstance& instance = model.instance(instanceIndex);
    std::unordered_map<std::string, utils::Entity> joints;
    for (size_t skin = 0; skin < instance.getSkinCount(); skin++) {
      const utils::Entity* entities = instance.getJointsAt(skin);
      for (size_t i = 0; i < instance.getJointCountAt(skin); i++) {
        if (const char* name = model.asset().getName(entities[i])) {
          joints.try_emplace(name, entities[i]);
        }
      }
    }
    return joints;
  }

} // namespace

SkeletonFollower::SkeletonFollower(std::shared_ptr<ModelCore> source, size_t sourceIndex, std::shared_ptr<ModelCore> target,
                                   size_t targetIndex)
    : source_(std::move(source)), target_(std::move(target)), targetIndex_(targetIndex) {
  std::unordered_map<std::string, utils::Entity> sourceJoints = jointsByName(*source_, sourceIndex);
  for (const auto& [name, targetJoint] : jointsByName(*target_, targetIndex)) {
    auto found = sourceJoints.find(name);
    if (found != sourceJoints.end()) {
      joints_.emplace_back(found->second, targetJoint);
    }
  }
}

void SkeletonFollower::apply(::filament::TransformManager& transforms) {
  transforms.openLocalTransformTransaction();
  for (const auto& [sourceJoint, targetJoint] : joints_) {
    auto sourceTransform = transforms.getInstance(sourceJoint);
    auto targetTransform = transforms.getInstance(targetJoint);
    if (sourceTransform.isValid() && targetTransform.isValid()) {
      transforms.setTransform(targetTransform, transforms.getTransform(sourceTransform));
    }
  }
  transforms.commitLocalTransformTransaction();
  target_->instance(targetIndex_).getAnimator()->updateBoneMatrices();
}

void SkeletonFollower::stop() {
  stopped_ = true;
}

bool SkeletonFollower::isStopped() const {
  return stopped_ || !source_->isLive() || !target_->isLive();
}

} // namespace margelo::nitro::filament
