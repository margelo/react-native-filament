#pragma once

#include <memory>
#include <vector>

namespace margelo::nitro::filament {

class AnimationPlayerCore;

class AnimationPlayers final {
public:
  void add(const std::shared_ptr<AnimationPlayerCore>& player);
  bool advance(double deltaSeconds);
  void clear();

private:
  std::vector<std::weak_ptr<AnimationPlayerCore>> players_;
};

} // namespace margelo::nitro::filament
