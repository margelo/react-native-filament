//
// Created by Hanno Gödecke on 15.03.24.
//

#pragma once

#include "bullet/RNFRigidBodyWrapper.h"
#include "core/math/RNFTMat44Wrapper.h"
#include "core/utils/RNFEntityWrapper.h"
#include <filament/Engine.h>
#include <filament/TransformManager.h>

namespace margelo {

using namespace filament;

class TransformManagerImpl {
public:
  explicit TransformManagerImpl(std::shared_ptr<Engine> engine) : _engine(engine) {}

  std::shared_ptr<TMat44Wrapper> getTransform(Entity entity);
  std::shared_ptr<TMat44Wrapper> getWorldTransform(Entity entity);
  void openLocalTransformTransaction();
  void commitLocalTransformTransaction();
  void setTransform(Entity entity, std::shared_ptr<TMat44Wrapper> transform);
  std::shared_ptr<TMat44Wrapper> createIdentityMatrix();
  void setEntityPosition(Entity entity, std::vector<double> positionVec, bool multiplyCurrent);
  void setEntityRotation(Entity entity, double angleRadians, std::vector<double> axisVec, bool multiplyCurrent);
  void setEntityScale(Entity entity, std::vector<double> scaleVec, bool multiplyCurrent);
  void updateTransformByRigidBody(Entity entity, std::shared_ptr<RigidBodyWrapper> rigidBody);
  void transformToUnitCube(Entity rootEntity,
                           Aabb aabb);

private: // Internal
  void updateTransform(math::mat4 transform, Entity entity, bool multiplyCurrent);
  TransformManager::Instance getInstance(Entity entity, TransformManager& transformManager);

private:
  std::mutex _mutex;
  std::shared_ptr<Engine> _engine;
};

} // namespace margelo
