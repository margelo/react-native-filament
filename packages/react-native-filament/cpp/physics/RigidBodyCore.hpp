#pragma once

#include "ActivationState.hpp"
#include "CollisionShapeCore.hpp"
#include "HybridRigidBodySpec.hpp"
#include "resources/Resource.hpp"

#include <BulletDynamics/Dynamics/btRigidBody.h>
#include <LinearMath/btDefaultMotionState.h>
#include <filament/TransformManager.h>
#include <utils/Entity.h>

#include <memory>
#include <optional>
#include <string>

namespace margelo::nitro::filament {

class PhysicsWorldCore;

class RigidBodyCore final : public Resource {
public:
  struct Setup {
    std::string id;
    double mass;
    btTransform start;
    double friction;
    double restitution;
    double linearDamping;
    double angularDamping;
    std::optional<utils::Entity> entity;
  };

  RigidBodyCore(std::shared_ptr<PhysicsWorldCore> world, std::shared_ptr<CollisionShapeCore> shape, const Setup& setup);

  const std::string& id() const;
  double mass() const;
  const std::shared_ptr<CollisionShapeCore>& shape() const;
  btRigidBody& body();
  std::optional<utils::Entity> entity() const;
  void setEntity(std::optional<utils::Entity> entity);
  ActivationState activationState() const;
  void setActivationState(ActivationState state);
  void syncEntity(::filament::TransformManager& transforms) const;
  std::weak_ptr<HybridRigidBodySpec>& hybrid();

protected:
  void destroyNative() override;

private:
  std::shared_ptr<PhysicsWorldCore> world_;
  const std::shared_ptr<CollisionShapeCore> shape_;
  const std::string id_;
  const double mass_;
  std::unique_ptr<btDefaultMotionState> motionState_;
  std::unique_ptr<btRigidBody> body_;
  std::optional<utils::Entity> entity_;
  std::weak_ptr<HybridRigidBodySpec> hybrid_;
};

} // namespace margelo::nitro::filament
