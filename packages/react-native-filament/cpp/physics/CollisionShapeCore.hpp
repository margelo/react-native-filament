#pragma once

#include "CollisionShapeType.hpp"
#include "CylinderAxis.hpp"
#include "HybridCollisionShapeSpec.hpp"
#include "resources/Resource.hpp"

#include <BulletCollision/CollisionShapes/btCollisionShape.h>

#include <memory>
#include <tuple>

namespace margelo::nitro::filament {

class CollisionShapeCore final : public Resource {
public:
  static std::shared_ptr<CollisionShapeCore> box(const std::tuple<double, double, double>& halfExtent);
  static std::shared_ptr<CollisionShapeCore> sphere(double radius);
  static std::shared_ptr<CollisionShapeCore> cylinder(const std::tuple<double, double, double>& halfExtent, CylinderAxis axis);
  static std::shared_ptr<CollisionShapeCore> staticPlane(const std::tuple<double, double, double>& normal, double constant);

  CollisionShapeCore(CollisionShapeType type, std::unique_ptr<btCollisionShape> shape);

  CollisionShapeType type() const;
  btCollisionShape& shape();
  std::weak_ptr<HybridCollisionShapeSpec>& hybrid();

protected:
  void destroyNative() override;

private:
  const CollisionShapeType type_;
  std::unique_ptr<btCollisionShape> shape_;
  std::weak_ptr<HybridCollisionShapeSpec> hybrid_;
};

} // namespace margelo::nitro::filament
