//
// Created by Hanno Gödecke on 05.03.24.
//

#pragma once

#include "BoxShapeWrapper.h"
#include "DiscreteDynamicWorldWrapper.h"
#include "RigidBodyWrapper.h"
#include "jsi/HybridObject.h"

namespace margelo {

// Main Wrapper for all Bullet Physics related APIs
class BulletWrapper : public HybridObject {
public:
  explicit BulletWrapper() : HybridObject("BulletWrapper") {}
  void loadHybridMethods() override;

private:
  std::shared_ptr<DiscreteDynamicWorldWrapper> createDiscreteDynamicWorld(double gravityX, double gravityY, double gravityZ);
  std::shared_ptr<RigidBodyWrapper> createRigidBody(double mass, double x, double y, double z, std::shared_ptr<ShapeWrapper> shape);
  std::shared_ptr<BoxShapeWrapper> createBoxShape(double x, double y, double z);
};

} // namespace margelo
