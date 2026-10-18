#include "CollisionShapeCore.hpp"

#include "BulletConversion.hpp"

#include <BulletCollision/CollisionShapes/btBoxShape.h>
#include <BulletCollision/CollisionShapes/btCylinderShape.h>
#include <BulletCollision/CollisionShapes/btSphereShape.h>
#include <BulletCollision/CollisionShapes/btStaticPlaneShape.h>

#include <stdexcept>
#include <string>

namespace margelo::nitro::filament {

namespace {

  void requirePositive(const std::tuple<double, double, double>& values, const char* method) {
    auto [x, y, z] = values;
    if (!(x > 0) || !(y > 0) || !(z > 0)) {
      throw std::invalid_argument(std::string(method) + " needs positive half extents.");
    }
  }

} // namespace

std::shared_ptr<CollisionShapeCore> CollisionShapeCore::box(const std::tuple<double, double, double>& halfExtent) {
  requirePositive(halfExtent, "PhysicsWorld.createBoxShape()");
  return std::make_shared<CollisionShapeCore>(CollisionShapeType::BOX, std::make_unique<btBoxShape>(toBtVector3(halfExtent)));
}

std::shared_ptr<CollisionShapeCore> CollisionShapeCore::sphere(double radius) {
  if (!(radius > 0)) {
    throw std::invalid_argument("PhysicsWorld.createSphereShape() needs a positive radius, got " + std::to_string(radius) + ".");
  }
  return std::make_shared<CollisionShapeCore>(CollisionShapeType::SPHERE, std::make_unique<btSphereShape>(static_cast<btScalar>(radius)));
}

std::shared_ptr<CollisionShapeCore> CollisionShapeCore::cylinder(const std::tuple<double, double, double>& halfExtent, CylinderAxis axis) {
  requirePositive(halfExtent, "PhysicsWorld.createCylinderShape()");
  btVector3 extent = toBtVector3(halfExtent);
  std::unique_ptr<btCollisionShape> shape;
  switch (axis) {
    case CylinderAxis::X:
      shape = std::make_unique<btCylinderShapeX>(extent);
      break;
    case CylinderAxis::Y:
      shape = std::make_unique<btCylinderShape>(extent);
      break;
    case CylinderAxis::Z:
      shape = std::make_unique<btCylinderShapeZ>(extent);
      break;
  }
  return std::make_shared<CollisionShapeCore>(CollisionShapeType::CYLINDER, std::move(shape));
}

std::shared_ptr<CollisionShapeCore> CollisionShapeCore::staticPlane(const std::tuple<double, double, double>& normal, double constant) {
  btVector3 direction = toBtVector3(normal);
  if (direction.length2() == 0) {
    throw std::invalid_argument("PhysicsWorld.createStaticPlaneShape() needs a non-zero normal.");
  }
  return std::make_shared<CollisionShapeCore>(
      CollisionShapeType::STATIC_PLANE, std::make_unique<btStaticPlaneShape>(direction.normalized(), static_cast<btScalar>(constant)));
}

CollisionShapeCore::CollisionShapeCore(CollisionShapeType type, std::unique_ptr<btCollisionShape> shape)
    : Resource("CollisionShape"), type_(type), shape_(std::move(shape)) {}

CollisionShapeType CollisionShapeCore::type() const {
  return type_;
}

btCollisionShape& CollisionShapeCore::shape() {
  return *shape_;
}

std::weak_ptr<HybridCollisionShapeSpec>& CollisionShapeCore::hybrid() {
  return hybrid_;
}

// Bodies that still use the shape keep it alive; disposing only stops new bodies from using it.
void CollisionShapeCore::destroyNative() {}

} // namespace margelo::nitro::filament
