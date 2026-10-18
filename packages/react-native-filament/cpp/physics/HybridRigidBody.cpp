#include "HybridRigidBody.hpp"

#include "BulletConversion.hpp"
#include "HybridCollisionShape.hpp"
#include "utils/ComponentChecks.hpp"
#include "utils/EntityConversion.hpp"
#include "utils/ThreadChecks.hpp"

namespace margelo::nitro::filament {

std::shared_ptr<HybridRigidBodySpec> HybridRigidBody::of(const std::shared_ptr<EngineCore>& engine,
                                                         const std::shared_ptr<RigidBodyCore>& core) {
  if (std::shared_ptr<HybridRigidBodySpec> existing = core->hybrid().lock()) {
    return existing;
  }
  auto created = std::make_shared<HybridRigidBody>(engine, core);
  core->hybrid() = created;
  return created;
}

HybridRigidBody::HybridRigidBody(std::shared_ptr<EngineCore> engine, std::shared_ptr<RigidBodyCore> core)
    : HybridObject(TAG), engine_(std::move(engine)), core_(std::move(core)) {}

std::string HybridRigidBody::getId() {
  return core_->id();
}

double HybridRigidBody::getMass() {
  return core_->mass();
}

std::shared_ptr<HybridCollisionShapeSpec> HybridRigidBody::getShape() {
  return HybridCollisionShape::of(engine_, core_->shape());
}

double HybridRigidBody::getFriction() {
  return usable("RigidBody.friction").body().getFriction();
}

void HybridRigidBody::setFriction(double friction) {
  usable("RigidBody.friction").body().setFriction(static_cast<btScalar>(friction));
}

double HybridRigidBody::getRestitution() {
  return usable("RigidBody.restitution").body().getRestitution();
}

void HybridRigidBody::setRestitution(double restitution) {
  usable("RigidBody.restitution").body().setRestitution(static_cast<btScalar>(restitution));
}

ActivationState HybridRigidBody::getActivationState() {
  return usable("RigidBody.activationState").activationState();
}

void HybridRigidBody::setActivationState(ActivationState activationState) {
  usable("RigidBody.activationState").setActivationState(activationState);
}

std::tuple<double, double, double> HybridRigidBody::getLinearVelocity() {
  return fromBtVector3(usable("RigidBody.linearVelocity").body().getLinearVelocity());
}

void HybridRigidBody::setLinearVelocity(const std::tuple<double, double, double>& linearVelocity) {
  btRigidBody& body = usable("RigidBody.linearVelocity").body();
  body.setLinearVelocity(toBtVector3(linearVelocity));
  body.activate();
}

std::tuple<double, double, double> HybridRigidBody::getAngularVelocity() {
  return fromBtVector3(usable("RigidBody.angularVelocity").body().getAngularVelocity());
}

void HybridRigidBody::setAngularVelocity(const std::tuple<double, double, double>& angularVelocity) {
  btRigidBody& body = usable("RigidBody.angularVelocity").body();
  body.setAngularVelocity(toBtVector3(angularVelocity));
  body.activate();
}

std::optional<double> HybridRigidBody::getEntity() {
  std::optional<utils::Entity> entity = usable("RigidBody.entity").entity();
  return entity.has_value() ? std::optional<double>(fromEntity(*entity)) : std::nullopt;
}

void HybridRigidBody::setEntity(std::optional<double> entity) {
  RigidBodyCore& core = usable("RigidBody.entity");
  if (entity.has_value()) {
    requireComponent(engine_->engine().getTransformManager(), *entity, "RigidBody.entity", "transform");
    core.setEntity(toEntity(*entity));
  } else {
    core.setEntity(std::nullopt);
  }
}

void HybridRigidBody::setDamping(double linear, double angular) {
  usable("RigidBody.setDamping()").body().setDamping(static_cast<btScalar>(linear), static_cast<btScalar>(angular));
}

void HybridRigidBody::applyCentralImpulse(const std::tuple<double, double, double>& impulse) {
  btRigidBody& body = usable("RigidBody.applyCentralImpulse()").body();
  body.activate();
  body.applyCentralImpulse(toBtVector3(impulse));
}

void HybridRigidBody::applyCentralForce(const std::tuple<double, double, double>& force) {
  btRigidBody& body = usable("RigidBody.applyCentralForce()").body();
  body.activate();
  body.applyCentralForce(toBtVector3(force));
}

Mat4Tuple HybridRigidBody::getTransform() {
  btTransform transform;
  usable("RigidBody.getTransform()").body().getMotionState()->getWorldTransform(transform);
  return fromMat4f(toMat4f(transform));
}

void HybridRigidBody::setTransform(const Mat4Tuple& transform) {
  btRigidBody& body = usable("RigidBody.setTransform()").body();
  btTransform moved = toBtTransform(toMat4f(transform));
  body.setWorldTransform(moved);
  body.getMotionState()->setWorldTransform(moved);
  body.activate();
}

void HybridRigidBody::dispose() {
  engine_->dispose(core_);
}

RigidBodyCore& HybridRigidBody::usable(const char* method) {
  requireRenderThread(engine_->thread(), method);
  core_->requireLive(method);
  return *core_;
}

} // namespace margelo::nitro::filament
