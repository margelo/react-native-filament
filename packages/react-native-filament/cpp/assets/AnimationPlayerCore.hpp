#pragma once

#include "AnimationCommand.hpp"
#include "ModelCore.hpp"

#include <atomic>
#include <memory>
#include <mutex>
#include <optional>
#include <vector>

namespace margelo::nitro::filament {

class AnimationPlayerCore final {
public:
  AnimationPlayerCore(std::shared_ptr<ModelCore> model, size_t instanceIndex);

  const std::shared_ptr<ModelCore>& model() const;
  size_t animationCount() const;
  void send(AnimationCommand command);
  void stop();
  bool isStopped() const;
  bool advance(double deltaSeconds);

private:
  struct Clip {
    size_t index;
    double timeSeconds;
  };

  void apply(const PlayAnimation& command);
  void apply(const PauseAnimation& command);
  void apply(const SeekAnimation& command);
  void drainCommands();
  double wrap(const Clip& clip) const;

  const std::shared_ptr<ModelCore> model_;
  const size_t instanceIndex_;
  std::mutex commandsMutex_;
  std::vector<AnimationCommand> commands_;
  std::atomic<bool> stopped_{false};
  std::optional<Clip> current_;
  std::optional<Clip> previous_;
  bool playing_ = false;
  bool loop_ = true;
  double speed_ = 1;
  double crossFadeSeconds_ = 0;
  double crossFadeElapsedSeconds_ = 0;
};

} // namespace margelo::nitro::filament
