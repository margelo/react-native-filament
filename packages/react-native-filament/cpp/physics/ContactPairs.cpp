#include "ContactPairs.hpp"

#include "RigidBodyCore.hpp"

#include <BulletCollision/NarrowPhaseCollision/btPersistentManifold.h>

#include <algorithm>

namespace margelo::nitro::filament {

namespace {

  bool isPenetrating(btPersistentManifold& manifold) {
    for (int index = 0; index < manifold.getNumContacts(); index++) {
      if (manifold.getContactPoint(index).getDistance() < 0) {
        return true;
      }
    }
    return false;
  }

  std::shared_ptr<RigidBodyCore> owner(RigidBodyCore* body) {
    return std::static_pointer_cast<RigidBodyCore>(body->shared_from_this());
  }

} // namespace

std::vector<ContactChange> ContactPairs::update(btDispatcher& dispatcher) {
  std::set<Pair> touching;
  for (int index = 0; index < dispatcher.getNumManifolds(); index++) {
    btPersistentManifold& manifold = *dispatcher.getManifoldByIndexInternal(index);
    auto* first = static_cast<RigidBodyCore*>(manifold.getBody0()->getUserPointer());
    auto* second = static_cast<RigidBodyCore*>(manifold.getBody1()->getUserPointer());
    if (first == nullptr || second == nullptr || manifold.getNumContacts() == 0) {
      continue;
    }
    Pair pair = std::minmax(first, second);
    if (touching_.contains(pair) || isPenetrating(manifold)) {
      touching.insert(pair);
    }
  }
  std::vector<ContactChange> changes;
  for (const Pair& pair : touching) {
    if (!touching_.contains(pair)) {
      changes.push_back({.kind = CollisionEventKind::BEGAN, .bodyA = owner(pair.first), .bodyB = owner(pair.second)});
    }
  }
  for (const Pair& pair : touching_) {
    if (!touching.contains(pair)) {
      changes.push_back({.kind = CollisionEventKind::ENDED, .bodyA = owner(pair.first), .bodyB = owner(pair.second)});
    }
  }
  touching_ = std::move(touching);
  return changes;
}

void ContactPairs::forget(const RigidBodyCore* body) {
  std::erase_if(touching_, [body](const Pair& pair) { return pair.first == body || pair.second == body; });
}

} // namespace margelo::nitro::filament
