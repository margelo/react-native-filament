#include "HybridAnimator.hpp"

#include "AnimationPlayerCore.hpp"
#include "HybridAnimationPlayer.hpp"
#include "engine/HybridEngine.hpp"
#include "utils/IndexChecks.hpp"
#include "utils/ThreadChecks.hpp"

#include <gltfio/Animator.h>

namespace margelo::nitro::filament {

HybridAnimator::HybridAnimator(std::shared_ptr<HybridEngine> engine, std::shared_ptr<ModelCore> core, size_t instanceIndex)
    : HybridObject(TAG), engine_(std::move(engine)), core_(std::move(core)), instanceIndex_(instanceIndex) {}

std::vector<AnimationInfo> HybridAnimator::getAnimations() {
  return animations();
}

void HybridAnimator::applyAnimation(double animationIndex, double timeSeconds) {
  ::filament::gltfio::Animator& animator = requireAnimator("Animator.applyAnimation()");
  animator.applyAnimation(requireAnimationIndex(animationIndex, "Animator.applyAnimation()"), static_cast<float>(timeSeconds));
}

void HybridAnimator::applyCrossFade(double previousIndex, double previousTimeSeconds, double alpha) {
  ::filament::gltfio::Animator& animator = requireAnimator("Animator.applyCrossFade()");
  animator.applyCrossFade(requireAnimationIndex(previousIndex, "Animator.applyCrossFade()"), static_cast<float>(previousTimeSeconds),
                          static_cast<float>(alpha));
}

void HybridAnimator::updateBoneMatrices() {
  requireAnimator("Animator.updateBoneMatrices()").updateBoneMatrices();
}

void HybridAnimator::resetBoneMatrices() {
  requireAnimator("Animator.resetBoneMatrices()").resetBoneMatrices();
}

std::shared_ptr<HybridAnimationPlayerSpec> HybridAnimator::createPlayer() {
  core_->requireLive("Animator.createPlayer()");
  auto player = std::make_shared<AnimationPlayerCore>(core_, instanceIndex_);
  const std::shared_ptr<EngineCore>& engine = engine_->core();
  engine->thread().post({.run = [engine, player] { engine->addAnimationPlayer(player); }});
  return std::make_shared<HybridAnimationPlayer>(engine, player);
}

::filament::gltfio::Animator& HybridAnimator::requireAnimator(const char* method) {
  requireRenderThread(engine_->core()->thread(), method);
  core_->requireLive(method);
  return *core_->instance(instanceIndex_).getAnimator();
}

size_t HybridAnimator::requireAnimationIndex(double index, const char* method) const {
  return requireIndex(index, animations().size(), method, "animations");
}

const std::vector<AnimationInfo>& HybridAnimator::animations() const {
  return core_->snapshot().instances[instanceIndex_].animations;
}

} // namespace margelo::nitro::filament
