#include "AnimationPlayers.hpp"

#include "AnimationPlayerCore.hpp"

namespace margelo::nitro::filament {

void AnimationPlayers::add(const std::shared_ptr<AnimationPlayerCore>& player) {
  players_.push_back(player);
}

bool AnimationPlayers::advance(double deltaSeconds) {
  bool playing = false;
  std::erase_if(players_, [&](const std::weak_ptr<AnimationPlayerCore>& weak) {
    std::shared_ptr<AnimationPlayerCore> player = weak.lock();
    if (player == nullptr || player->isStopped()) {
      return true;
    }
    playing = player->advance(deltaSeconds) || playing;
    return false;
  });
  return playing;
}

void AnimationPlayers::clear() {
  players_.clear();
}

} // namespace margelo::nitro::filament
