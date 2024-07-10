//
// Created by Hanno Gödecke on 20.04.24.
//

#pragma once

#include "RNFTransformManagerImpl.h"
#include "jsi/RNFPointerHolder.h"

namespace margelo {

class TransformManagerWrapper : public PointerHolder<TransformManagerImpl> {
public:
  explicit TransformManagerWrapper(std::shared_ptr<TransformManagerImpl> transformManager)
      : PointerHolder("TransformManagerWrapper", transformManager) {}

  void loadHybridMethods() override;

private: // Exposed JS API:
  std::shared_ptr<TMat44Wrapper> getTransform(std::shared_ptr<EntityWrapper> entityWrapper);
  std::shared_ptr<TMat44Wrapper> getWorldTransform(std::shared_ptr<EntityWrapper> entityWrapper);
  void openLocalTransformTransaction();
  void commitLocalTransformTransaction();
  void setTransform(std::shared_ptr<EntityWrapper> entityWrapper, std::shared_ptr<TMat44Wrapper> transform);
  std::shared_ptr<TMat44Wrapper> createIdentityMatrix();
  void setEntityPosition(std::shared_ptr<EntityWrapper> entity, std::vector<double> positionVec, bool multiplyCurrent);
  void setEntityRotation(std::shared_ptr<EntityWrapper> entity, double angleRadians, std::vector<double> axisVec, bool multiplyCurrent);
  void setEntityScale(std::shared_ptr<EntityWrapper> entity, std::vector<double> scaleVec, bool multiplyCurrent);
  void updateTransformByRigidBody(std::shared_ptr<EntityWrapper> entityWrapper, std::shared_ptr<RigidBodyWrapper> rigidBody);
  void transformToUnitCube(std::shared_ptr<EntityWrapper> rootEntityWrapper,
                           std::shared_ptr<AABBWrapper> aabbWrapper);

private: // Internal
  Entity getEntity(std::shared_ptr<EntityWrapper> entityWrapper);
};

} // namespace margelo
