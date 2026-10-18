#include "HybridPhysicsWorld.hpp"

#include "BulletConversion.hpp"
#include "HybridCollisionShape.hpp"
#include "HybridRigidBody.hpp"
#include "engine/HybridEngine.hpp"
#include "utils/ComponentChecks.hpp"
#include "utils/EngineChecks.hpp"
#include "utils/EntityConversion.hpp"
#include "utils/ThreadChecks.hpp"

#include <stdexcept>
#include <string>

namespace margelo::nitro::filament {

HybridPhysicsWorld::HybridPhysicsWorld(std::shared_ptr<HybridEngine> engine, std::shared_ptr<PhysicsWorldCore> core)
    : HybridObject(TAG), engine_(std::move(engine)), core_(std::move(core)) {}

std::tuple<double, double, double> HybridPhysicsWorld::getGravity() {
  return fromBtVector3(usable("PhysicsWorld.gravity").world().getGravity());
}

void HybridPhysicsWorld::setGravity(const std::tuple<double, double, double>& gravity) {
  usable("PhysicsWorld.gravity").world().setGravity(toBtVector3(gravity));
}

double HybridPhysicsWorld::getBodyCount() {
  return static_cast<double>(usable("PhysicsWorld.bodyCount").bodyCount());
}

std::shared_ptr<HybridCollisionShapeSpec> HybridPhysicsWorld::createBoxShape(const std::tuple<double, double, double>& halfExtent) {
  usable("PhysicsWorld.createBoxShape()");
  return adoptShape(CollisionShapeCore::box(halfExtent));
}

std::shared_ptr<HybridCollisionShapeSpec> HybridPhysicsWorld::createSphereShape(double radius) {
  usable("PhysicsWorld.createSphereShape()");
  return adoptShape(CollisionShapeCore::sphere(radius));
}

std::shared_ptr<HybridCollisionShapeSpec> HybridPhysicsWorld::createCylinderShape(const std::tuple<double, double, double>& halfExtent,
                                                                                  CylinderAxis axis) {
  usable("PhysicsWorld.createCylinderShape()");
  return adoptShape(CollisionShapeCore::cylinder(halfExtent, axis));
}

std::shared_ptr<HybridCollisionShapeSpec> HybridPhysicsWorld::createStaticPlaneShape(const std::tuple<double, double, double>& normal,
                                                                                     double constant) {
  usable("PhysicsWorld.createStaticPlaneShape()");
  return adoptShape(CollisionShapeCore::staticPlane(normal, constant));
}

std::shared_ptr<HybridRigidBodySpec> HybridPhysicsWorld::createRigidBody(const RigidBodyOptions& options) {
  constexpr const char* method = "PhysicsWorld.createRigidBody()";
  PhysicsWorldCore& world = usable(method);
  const std::shared_ptr<EngineCore>& engine = engine_->core();
  std::shared_ptr<CollisionShapeCore> shape = requireSameEngine<HybridCollisionShape>(options.shape, *engine, method)->core();
  shape->requireLive(method);
  if (!(options.mass >= 0)) {
    throw std::invalid_argument(std::string(method) + " needs a mass of at least 0, got " + std::to_string(options.mass) + ".");
  }
  if (shape->type() == CollisionShapeType::STATIC_PLANE && options.mass > 0) {
    throw std::invalid_argument(std::string(method) + " can only use a static plane shape with a mass of 0.");
  }
  if (options.entity.has_value()) {
    requireComponent(engine->engine().getTransformManager(), *options.entity, method, "transform");
  }
  RigidBodyCore::Setup setup{
      .id = options.id.value_or(""),
      .mass = options.mass,
      .start = btTransform(toBtQuaternion(options.rotation.value_or(std::make_tuple(0.0, 0.0, 0.0, 1.0))),
                           toBtVector3(options.position.value_or(std::make_tuple(0.0, 0.0, 0.0)))),
      .friction = options.friction.value_or(0.5),
      .restitution = options.restitution.value_or(0),
      .linearDamping = options.linearDamping.value_or(0),
      .angularDamping = options.angularDamping.value_or(0),
      .entity = options.entity.has_value() ? std::optional<utils::Entity>(toEntity(*options.entity)) : std::nullopt,
  };
  std::shared_ptr<RigidBodyCore> body = world.createBody(shape, setup);
  body->syncEntity(engine->engine().getTransformManager());
  engine->requestFrame();
  return HybridRigidBody::of(engine, body);
}

void HybridPhysicsWorld::step(double deltaSeconds) {
  PhysicsWorldCore& world = usable("PhysicsWorld.step()");
  if (!(deltaSeconds >= 0)) {
    throw std::invalid_argument("PhysicsWorld.step() needs a delta of at least 0 seconds, got " + std::to_string(deltaSeconds) + ".");
  }
  world.step(deltaSeconds);
}

ListenerSubscription HybridPhysicsWorld::addOnCollisionListener(const std::function<bool(const std::vector<CollisionEvent>&)>& listener) {
  PhysicsWorldCore& world = usable("PhysicsWorld.addOnCollisionListener()");
  std::shared_ptr<EngineCore> engine = engine_->core();
  std::weak_ptr<CollisionListeners::Entry> entry =
      world.addCollisionListener([engine, listener](const std::vector<ContactChange>& changes) {
        std::vector<CollisionEvent> events;
        events.reserve(changes.size());
        for (const ContactChange& change : changes) {
          events.emplace_back(change.kind, HybridRigidBody::of(engine, change.bodyA), HybridRigidBody::of(engine, change.bodyB));
        }
        return listener(events);
      });
  return ListenerSubscription([entry] {
    if (std::shared_ptr<CollisionListeners::Entry> registered = entry.lock()) {
      registered->removed = true;
    }
  });
}

void HybridPhysicsWorld::dispose() {
  engine_->core()->dispose(core_);
}

PhysicsWorldCore& HybridPhysicsWorld::usable(const char* method) {
  requireRenderThread(engine_->core()->thread(), method);
  core_->requireLive(method);
  return *core_;
}

std::shared_ptr<HybridCollisionShapeSpec> HybridPhysicsWorld::adoptShape(std::shared_ptr<CollisionShapeCore> shape) {
  return HybridCollisionShape::of(engine_->core(), core_->adoptShape(std::move(shape)));
}

size_t HybridPhysicsWorld::getExternalMemorySize() noexcept {
  constexpr size_t kBytesPerBody = 1024;
  return core_->isLive() ? core_->bodyCount() * kBytesPerBody : 0;
}

} // namespace margelo::nitro::filament
