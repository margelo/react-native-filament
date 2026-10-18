#pragma once

#include "CollisionEventKind.hpp"

#include <memory>

namespace margelo::nitro::filament {

class RigidBodyCore;

struct ContactChange {
  CollisionEventKind kind;
  std::shared_ptr<RigidBodyCore> bodyA;
  std::shared_ptr<RigidBodyCore> bodyB;
};

} // namespace margelo::nitro::filament
