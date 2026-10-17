#pragma once

#include "HybridAnimatorSpec.hpp"
#include "ModelCore.hpp"

#include <memory>

namespace margelo::nitro::filament {

class HybridEngine;

class HybridAnimator final : public HybridAnimatorSpec {
public:
  HybridAnimator(std::shared_ptr<HybridEngine> engine, std::shared_ptr<ModelCore> core, size_t instanceIndex,
                 std::shared_ptr<const ModelInstanceSnapshot> snapshot);

  std::vector<AnimationInfo> getAnimations() override;
  void applyAnimation(double animationIndex, double timeSeconds) override;
  void applyCrossFade(double previousIndex, double previousTimeSeconds, double alpha) override;
  void updateBoneMatrices() override;
  void resetBoneMatrices() override;
  std::shared_ptr<HybridAnimationPlayerSpec> createPlayer() override;

private:
  ::filament::gltfio::Animator& requireAnimator(const char* method);
  size_t requireAnimationIndex(double index, const char* method) const;
  const std::vector<AnimationInfo>& animations() const;

  std::shared_ptr<HybridEngine> engine_;
  std::shared_ptr<ModelCore> core_;
  size_t instanceIndex_;
  std::shared_ptr<const ModelInstanceSnapshot> snapshot_;
};

} // namespace margelo::nitro::filament
