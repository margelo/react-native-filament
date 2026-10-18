#pragma once

#include "HybridPhysicsWorldSpec.hpp"
#include "PhysicsWorldCore.hpp"

#include <memory>

namespace margelo::nitro::filament {

class HybridEngine;

class HybridPhysicsWorld final : public HybridPhysicsWorldSpec {
public:
  HybridPhysicsWorld(std::shared_ptr<HybridEngine> engine, std::shared_ptr<PhysicsWorldCore> core);

  std::tuple<double, double, double> getGravity() override;
  void setGravity(const std::tuple<double, double, double>& gravity) override;
  double getBodyCount() override;
  std::shared_ptr<HybridCollisionShapeSpec> createBoxShape(const std::tuple<double, double, double>& halfExtent) override;
  std::shared_ptr<HybridCollisionShapeSpec> createSphereShape(double radius) override;
  std::shared_ptr<HybridCollisionShapeSpec> createCylinderShape(const std::tuple<double, double, double>& halfExtent,
                                                                CylinderAxis axis) override;
  std::shared_ptr<HybridCollisionShapeSpec> createStaticPlaneShape(const std::tuple<double, double, double>& normal,
                                                                   double constant) override;
  std::shared_ptr<HybridRigidBodySpec> createRigidBody(const RigidBodyOptions& options) override;
  void step(double deltaSeconds) override;
  ListenerSubscription addOnCollisionListener(const std::function<bool(const std::vector<CollisionEvent>&)>& listener) override;
  void dispose() override;

private:
  PhysicsWorldCore& usable(const char* method);
  std::shared_ptr<HybridCollisionShapeSpec> adoptShape(std::shared_ptr<CollisionShapeCore> shape);

  std::shared_ptr<HybridEngine> engine_;
  std::shared_ptr<PhysicsWorldCore> core_;
};

} // namespace margelo::nitro::filament
