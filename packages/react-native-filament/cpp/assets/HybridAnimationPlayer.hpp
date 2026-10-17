#pragma once

#include "AnimationPlayerCore.hpp"
#include "HybridAnimationPlayerSpec.hpp"

#include <memory>

namespace margelo::nitro::filament {

class HybridAnimationPlayer final : public HybridAnimationPlayerSpec {
public:
  HybridAnimationPlayer(std::shared_ptr<EngineCore> engine, std::shared_ptr<AnimationPlayerCore> core);
  ~HybridAnimationPlayer() override;

  void play(double animationIndex, const PlayOptions& options) override;
  void pause() override;
  void seek(double timeSeconds) override;
  void dispose() override;

private:
  void send(AnimationCommand command, const char* method);

  std::shared_ptr<EngineCore> engine_;
  std::shared_ptr<AnimationPlayerCore> core_;
};

} // namespace margelo::nitro::filament
