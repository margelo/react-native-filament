//
// Created by Hanno Gödecke on 05.03.24.
//

#pragma once

#include "RNFBoxShapeWrapper.h"
#include "RNFCylinderShapeWrapper.h"
#include "RNFCylinderShapeWrapperX.h"
#include "RNFCylinderShapeWrapperZ.h"
#include "RNFDiscreteDynamicWorldWrapper.h"
#include "RNFRigidBodyWrapper.h"
#include "RNFSphereShapeWrapper.h"
#include "RNFStaticPlaneShapeWrapper.h"
#if __has_include(<NitroModules/HybridObject.hpp>)
#include <NitroModules/HybridObject.hpp>
#else
#error NitroModules cannot be found! Are you sure you installed NitroModules properly?
#endif

namespace margelo {

// Main Wrapper for all Bullet Physics related APIs
class BulletWrapper : public nitro::HybridObject {
public:
  explicit BulletWrapper() : HybridObject("BulletWrapper") {}
  void loadHybridMethods() override;

private:
  std::shared_ptr<DiscreteDynamicWorldWrapper> createDiscreteDynamicWorld(double gravityX, double gravityY, double gravityZ);
  std::shared_ptr<RigidBodyWrapper> createRigidBody(double mass, double x, double y, double z, const std::shared_ptr<ShapeWrapper>& shape,
                                                    std::string id, const std::optional<CollisionCallback>& collisionCallback);
  std::shared_ptr<RigidBodyWrapper> createRigidBodyFromTransform(double mass, const std::shared_ptr<TMat44Wrapper>& entityTransform,
                                                                 const std::shared_ptr<ShapeWrapper>& shape, std::string id,
                                                                 const std::optional<CollisionCallback>& collisionCallback);
  std::shared_ptr<BoxShapeWrapper> createBoxShape(double x, double y, double z);
  std::shared_ptr<CylinderShapeWrapper> createCylinderShape(double x, double y, double z);
  std::shared_ptr<CylinderShapeWrapperX> createCylinderShapeX(double x, double y, double z);
  std::shared_ptr<CylinderShapeWrapperZ> createCylinderShapeZ(double x, double y, double z);
  std::shared_ptr<StaticPlaneShapeWrapper> createStaticPlaneShape(double normalX, double normalY, double normalZ, double planeConstant);
  std::shared_ptr<SphereShapeWrapper> createSphereShape(double radius);
};

} // namespace margelo
