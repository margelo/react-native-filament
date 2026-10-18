#pragma once

#include "CollisionListeners.hpp"
#include "ContactPairs.hpp"
#include "RigidBodyCore.hpp"
#include "engine/EngineCore.hpp"
#include "resources/Resource.hpp"

#include <BulletCollision/BroadphaseCollision/btDbvtBroadphase.h>
#include <BulletCollision/CollisionDispatch/btCollisionDispatcher.h>
#include <BulletCollision/CollisionDispatch/btDefaultCollisionConfiguration.h>
#include <BulletDynamics/ConstraintSolver/btSequentialImpulseConstraintSolver.h>
#include <BulletDynamics/Dynamics/btDiscreteDynamicsWorld.h>

#include <memory>
#include <vector>

namespace margelo::nitro::filament {

class PhysicsWorldCore final : public Resource {
public:
  struct Settings {
    btVector3 gravity;
    double fixedTimeStepSeconds;
    int maxSubSteps;
    bool autoStep;
  };

  PhysicsWorldCore(std::shared_ptr<EngineCore> engine, Settings settings);

  const std::shared_ptr<EngineCore>& engine() const;
  bool autoSteps() const;
  bool isStopped() const;
  btDiscreteDynamicsWorld& world();
  size_t bodyCount() const;
  std::shared_ptr<CollisionShapeCore> adoptShape(std::shared_ptr<CollisionShapeCore> shape);
  std::shared_ptr<RigidBodyCore> createBody(const std::shared_ptr<CollisionShapeCore>& shape, const RigidBodyCore::Setup& setup);
  void detach(RigidBodyCore& body);
  std::shared_ptr<CollisionListeners::Entry> addCollisionListener(CollisionListeners::Callback callback);
  bool step(double deltaSeconds);

protected:
  void destroyNative() override;

private:
  std::shared_ptr<EngineCore> engine_;
  const Settings settings_;
  std::unique_ptr<btDefaultCollisionConfiguration> configuration_;
  std::unique_ptr<btCollisionDispatcher> dispatcher_;
  std::unique_ptr<btDbvtBroadphase> broadphase_;
  std::unique_ptr<btSequentialImpulseConstraintSolver> solver_;
  std::unique_ptr<btDiscreteDynamicsWorld> world_;
  std::vector<std::shared_ptr<RigidBodyCore>> bodies_;
  ContactPairs contacts_;
  CollisionListeners collisionListeners_;
};

} // namespace margelo::nitro::filament
