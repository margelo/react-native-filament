#pragma once

#include "ContactChange.hpp"

#include <BulletCollision/BroadphaseCollision/btDispatcher.h>

#include <set>
#include <utility>
#include <vector>

namespace margelo::nitro::filament {

/**
 * Tracks which bodies touch between steps. A pair begins touching when a contact point penetrates
 * and stops when Bullet drops the pair's last contact point, so resting contacts do not flicker.
 */
class ContactPairs final {
public:
  std::vector<ContactChange> update(btDispatcher& dispatcher);
  void forget(const RigidBodyCore* body);

private:
  using Pair = std::pair<RigidBodyCore*, RigidBodyCore*>;

  std::set<Pair> touching_;
};

} // namespace margelo::nitro::filament
