#pragma once

#include <cstddef>
#include <variant>

namespace margelo::nitro::filament {

struct PlayAnimation {
  size_t animationIndex;
  bool loop;
  double speed;
  double crossFadeSeconds;
};

struct PauseAnimation {};

struct SeekAnimation {
  double timeSeconds;
};

using AnimationCommand = std::variant<PlayAnimation, PauseAnimation, SeekAnimation>;

} // namespace margelo::nitro::filament
