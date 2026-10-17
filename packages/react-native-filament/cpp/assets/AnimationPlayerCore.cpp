#include "AnimationPlayerCore.hpp"

#include <gltfio/Animator.h>

#include <algorithm>
#include <cmath>

namespace margelo::nitro::filament {

AnimationPlayerCore::AnimationPlayerCore(std::shared_ptr<ModelCore> model, size_t instanceIndex)
    : model_(std::move(model)), instanceIndex_(instanceIndex) {}

const std::shared_ptr<ModelCore>& AnimationPlayerCore::model() const {
  return model_;
}

size_t AnimationPlayerCore::animationCount() const {
  return model_->snapshot().instances[instanceIndex_].animations.size();
}

void AnimationPlayerCore::send(AnimationCommand command) {
  std::unique_lock lock(commandsMutex_);
  commands_.push_back(command);
}

void AnimationPlayerCore::stop() {
  stopped_ = true;
}

bool AnimationPlayerCore::isStopped() const {
  return stopped_ || !model_->isLive();
}

bool AnimationPlayerCore::advance(double deltaSeconds) {
  if (isStopped()) {
    return false;
  }
  drainCommands();
  if (!current_.has_value()) {
    return false;
  }
  if (playing_) {
    current_->timeSeconds += deltaSeconds * speed_;
    if (previous_.has_value()) {
      previous_->timeSeconds += deltaSeconds * speed_;
      crossFadeElapsedSeconds_ += deltaSeconds;
    }
  }
  ::filament::gltfio::Animator& animator = *model_->instance(instanceIndex_).getAnimator();
  current_->timeSeconds = wrap(*current_);
  double duration = animator.getAnimationDuration(current_->index);
  if (!loop_ && current_->timeSeconds >= duration) {
    playing_ = false;
  }
  animator.applyAnimation(current_->index, static_cast<float>(current_->timeSeconds));
  if (previous_.has_value() && crossFadeElapsedSeconds_ < crossFadeSeconds_) {
    float alpha = static_cast<float>(crossFadeElapsedSeconds_ / crossFadeSeconds_);
    animator.applyCrossFade(previous_->index, static_cast<float>(wrap(*previous_)), alpha);
  } else {
    previous_.reset();
  }
  animator.updateBoneMatrices();
  return playing_;
}

void AnimationPlayerCore::drainCommands() {
  std::vector<AnimationCommand> commands;
  {
    std::unique_lock lock(commandsMutex_);
    commands.swap(commands_);
  }
  for (const AnimationCommand& command : commands) {
    std::visit([this](const auto& value) { apply(value); }, command);
  }
}

void AnimationPlayerCore::apply(const PlayAnimation& command) {
  previous_.reset();
  if (current_.has_value() && command.crossFadeSeconds > 0) {
    previous_ = current_;
  }
  current_ = Clip{.index = command.animationIndex, .timeSeconds = 0};
  playing_ = true;
  loop_ = command.loop;
  speed_ = command.speed;
  crossFadeSeconds_ = command.crossFadeSeconds;
  crossFadeElapsedSeconds_ = 0;
}

void AnimationPlayerCore::apply(const PauseAnimation&) {
  playing_ = false;
}

void AnimationPlayerCore::apply(const SeekAnimation& command) {
  if (current_.has_value()) {
    current_->timeSeconds = command.timeSeconds;
  }
}

double AnimationPlayerCore::wrap(const Clip& clip) const {
  double duration = model_->instance(instanceIndex_).getAnimator()->getAnimationDuration(clip.index);
  if (duration <= 0) {
    return 0;
  }
  if (loop_) {
    return std::fmod(std::fmod(clip.timeSeconds, duration) + duration, duration);
  }
  return std::clamp(clip.timeSeconds, 0.0, duration);
}

} // namespace margelo::nitro::filament
