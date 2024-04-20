//
// Created by Hanno Gödecke on 15.03.24.
//

#pragma once

#include "bullet/RigidBodyWrapper.h"
#include "core/math/TMat44Wrapper.h"
#include "core/utils/EntityWrapper.h"
#include "jsi/HybridObject.h"
#include <filament/TransformManager.h>

namespace margelo {

using namespace filament;

class TransformManagerWrapper : public HybridObject {
public:
  explicit TransformManagerWrapper(filament::TransformManager& transformManager)
      : HybridObject("TransformManagerWrapper"), _transformManager(transformManager) {}

  void loadHybridMethods() override;

private: // Public JS API
  std::shared_ptr<TMat44Wrapper> getTransform(std::shared_ptr<EntityWrapper> entity);
  std::shared_ptr<TMat44Wrapper> getWorldTransform(std::shared_ptr<EntityWrapper> entity);
  void openLocalTransformTransaction();
  void commitLocalTransformTransaction();
  void setTransform(std::shared_ptr<EntityWrapper> entityWrapper, std::shared_ptr<TMat44Wrapper> transform);
  std::shared_ptr<TMat44Wrapper> createIdentityMatrix();
  void setEntityPosition(std::shared_ptr<EntityWrapper> entity, std::vector<double> positionVec, bool multiplyCurrent);
  void setEntityRotation(std::shared_ptr<EntityWrapper> entity, double angleRadians, std::vector<double> axisVec, bool multiplyCurrent);
  void setEntityScale(std::shared_ptr<EntityWrapper> entity, std::vector<double> scaleVec, bool multiplyCurrent);
  void updateTransformByRigidBody(std::shared_ptr<EntityWrapper> entityWrapper, std::shared_ptr<RigidBodyWrapper> rigidBody);
  void transformToUnitCube(std::shared_ptr<FilamentAssetWrapper> assetWrapper);

private: // Internal
  void updateTransform(math::mat4 transform, std::shared_ptr<EntityWrapper> entity, bool multiplyCurrent);

private:
  std::mutex _mutex;
  filament::TransformManager& _transformManager;
};

} // namespace margelo
