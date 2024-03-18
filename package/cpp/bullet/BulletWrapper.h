//
// Created by Hanno Gödecke on 05.03.24.
//

#pragma once

#include "BoxShapeWrapper.h"
#include "CylinderShapeWrapper.h"
#include "CylinderShapeWrapperX.h"
#include "CylinderShapeWrapperZ.h"
#include "DiscreteDynamicWorldWrapper.h"
#include "RigidBodyWrapper.h"
#include "StaticPlaneShapeWrapper.h"
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
  std::shared_ptr<RigidBodyWrapper> createRigidBodyFromTransform(double mass, std::shared_ptr<TMat44Wrapper> entityTransform,
                                                                 std::shared_ptr<ShapeWrapper> shape);
  std::shared_ptr<BoxShapeWrapper> createBoxShape(double x, double y, double z);
  std::shared_ptr<CylinderShapeWrapper> createCylinderShape(double x, double y, double z);
  std::shared_ptr<CylinderShapeWrapperX> createCylinderShapeX(double x, double y, double z);
  std::shared_ptr<CylinderShapeWrapperZ> createCylinderShapeZ(double x, double y, double z);
  std::shared_ptr<StaticPlaneShapeWrapper> createStaticPlaneShape(double normalX, double normalY, double normalZ, double planeConstant);
};

} // namespace margelo
