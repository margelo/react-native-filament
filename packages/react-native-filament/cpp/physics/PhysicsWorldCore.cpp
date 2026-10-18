#include "PhysicsWorldCore.hpp"

#include <algorithm>

namespace margelo::nitro::filament {

PhysicsWorldCore::PhysicsWorldCore(std::shared_ptr<EngineCore> engine, Settings settings)
    : Resource("PhysicsWorld"), engine_(std::move(engine)), settings_(settings),
      configuration_(std::make_unique<btDefaultCollisionConfiguration>()),
      dispatcher_(std::make_unique<btCollisionDispatcher>(configuration_.get())), broadphase_(std::make_unique<btDbvtBroadphase>()),
      solver_(std::make_unique<btSequentialImpulseConstraintSolver>()),
      world_(std::make_unique<btDiscreteDynamicsWorld>(dispatcher_.get(), broadphase_.get(), solver_.get(), configuration_.get())) {
  world_->setGravity(settings_.gravity);
  world_->setLatencyMotionStateInterpolation(false);
}

const std::shared_ptr<EngineCore>& PhysicsWorldCore::engine() const {
  return engine_;
}

bool PhysicsWorldCore::autoSteps() const {
  return settings_.autoStep;
}

bool PhysicsWorldCore::isStopped() const {
  return !isLive();
}

btDiscreteDynamicsWorld& PhysicsWorldCore::world() {
  return *world_;
}

size_t PhysicsWorldCore::bodyCount() const {
  return bodies_.size();
}

std::shared_ptr<CollisionShapeCore> PhysicsWorldCore::adoptShape(std::shared_ptr<CollisionShapeCore> shape) {
  adopt(shape);
  return shape;
}

std::shared_ptr<RigidBodyCore> PhysicsWorldCore::createBody(const std::shared_ptr<CollisionShapeCore>& shape,
                                                            const RigidBodyCore::Setup& setup) {
  auto self = std::static_pointer_cast<PhysicsWorldCore>(shared_from_this());
  auto body = std::make_shared<RigidBodyCore>(self, shape, setup);
  world_->addRigidBody(&body->body());
  bodies_.push_back(body);
  adopt(body);
  return body;
}

void PhysicsWorldCore::detach(RigidBodyCore& body) {
  contacts_.forget(&body);
  world_->removeRigidBody(&body.body());
  std::erase_if(bodies_, [&](const std::shared_ptr<RigidBodyCore>& existing) { return existing.get() == &body; });
}

std::shared_ptr<CollisionListeners::Entry> PhysicsWorldCore::addCollisionListener(CollisionListeners::Callback callback) {
  return collisionListeners_.add(std::move(callback));
}

bool PhysicsWorldCore::step(double deltaSeconds) {
  world_->stepSimulation(static_cast<btScalar>(deltaSeconds), settings_.maxSubSteps, static_cast<btScalar>(settings_.fixedTimeStepSeconds));
  ::filament::TransformManager& transforms = engine_->engine().getTransformManager();
  bool active = false;
  for (const std::shared_ptr<RigidBodyCore>& body : bodies_) {
    body->syncEntity(transforms);
    active = active || body->body().isActive();
  }
  std::vector<ContactChange> changes = contacts_.update(*dispatcher_);
  std::shared_ptr<worklets::WorkletRuntime> runtime = engine_->runtime();
  if (!changes.empty() && runtime != nullptr && !collisionListeners_.empty()) {
    collisionListeners_.dispatch(changes, *runtime);
  }
  return active;
}

void PhysicsWorldCore::destroyNative() {
  collisionListeners_.clear();
  world_ = nullptr;
  solver_ = nullptr;
  broadphase_ = nullptr;
  dispatcher_ = nullptr;
  configuration_ = nullptr;
}

} // namespace margelo::nitro::filament
