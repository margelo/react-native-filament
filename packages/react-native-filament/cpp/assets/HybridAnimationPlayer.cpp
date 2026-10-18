#include "HybridAnimationPlayer.hpp"

#include "utils/IndexChecks.hpp"

#include <stdexcept>
#include <string>

namespace margelo::nitro::filament {

HybridAnimationPlayer::HybridAnimationPlayer(std::shared_ptr<EngineCore> engine, std::shared_ptr<AnimationPlayerCore> core)
    : HybridObject(TAG), engine_(std::move(engine)), core_(std::move(core)) {}

HybridAnimationPlayer::~HybridAnimationPlayer() {
  core_->stop();
}

void HybridAnimationPlayer::play(double animationIndex, const PlayOptions& options) {
  size_t index = requireIndex(animationIndex, core_->animationCount(), "AnimationPlayer.play()", "animations");
  double crossFadeSeconds = options.crossFadeSeconds.value_or(0);
  if (crossFadeSeconds < 0) {
    throw std::invalid_argument("AnimationPlayer.play() needs crossFadeSeconds >= 0.");
  }
  send(PlayAnimation{.animationIndex = index,
                     .loop = options.loop.value_or(true),
                     .speed = options.speed.value_or(1),
                     .crossFadeSeconds = crossFadeSeconds},
       "AnimationPlayer.play()");
}

void HybridAnimationPlayer::pause() {
  send(PauseAnimation{}, "AnimationPlayer.pause()");
}

void HybridAnimationPlayer::seek(double timeSeconds) {
  send(SeekAnimation{.timeSeconds = timeSeconds}, "AnimationPlayer.seek()");
}

void HybridAnimationPlayer::dispose() {
  core_->stop();
}

void HybridAnimationPlayer::send(AnimationCommand command, const char* method) {
  core_->model()->requireLive(method);
  if (core_->isStopped()) {
    throw std::runtime_error(std::string("FilamentDisposedError: ") + method + " was called on a disposed AnimationPlayer.");
  }
  core_->send(command);
  engine_->requestFrame();
}

} // namespace margelo::nitro::filament
