#pragma once

#include "HybridRigidBodySpec.hpp"
#include "RigidBodyCore.hpp"
#include "engine/EngineCore.hpp"
#include "utils/MatrixConversion.hpp"

#include <memory>

namespace margelo::nitro::filament {

class HybridRigidBody final : public HybridRigidBodySpec {
public:
  static std::shared_ptr<HybridRigidBodySpec> of(const std::shared_ptr<EngineCore>& engine, const std::shared_ptr<RigidBodyCore>& core);

  HybridRigidBody(std::shared_ptr<EngineCore> engine, std::shared_ptr<RigidBodyCore> core);

  std::string getId() override;
  double getMass() override;
  std::shared_ptr<HybridCollisionShapeSpec> getShape() override;
  double getFriction() override;
  void setFriction(double friction) override;
  double getRestitution() override;
  void setRestitution(double restitution) override;
  ActivationState getActivationState() override;
  void setActivationState(ActivationState activationState) override;
  std::tuple<double, double, double> getLinearVelocity() override;
  void setLinearVelocity(const std::tuple<double, double, double>& linearVelocity) override;
  std::tuple<double, double, double> getAngularVelocity() override;
  void setAngularVelocity(const std::tuple<double, double, double>& angularVelocity) override;
  std::optional<double> getEntity() override;
  void setEntity(std::optional<double> entity) override;
  void setDamping(double linear, double angular) override;
  void applyCentralImpulse(const std::tuple<double, double, double>& impulse) override;
  void applyCentralForce(const std::tuple<double, double, double>& force) override;
  Mat4Tuple getTransform() override;
  void setTransform(const Mat4Tuple& transform) override;
  void dispose() override;

private:
  RigidBodyCore& usable(const char* method);

  std::shared_ptr<EngineCore> engine_;
  std::shared_ptr<RigidBodyCore> core_;
};

} // namespace margelo::nitro::filament
