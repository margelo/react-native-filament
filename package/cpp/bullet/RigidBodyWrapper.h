//
// Created by Hanno Gödecke on 05.03.24.
//

#pragma once

#include "ActivationStateEnum.h"
#include "core/FilamentAssetWrapper.h"
#include "core/math/TMat44Wrapper.h"
#include "jsi/HybridObject.h"

#include <btBulletDynamicsCommon.h>

namespace margelo {

using CollisionCallback = std::function<void(std::string)>; // ID of the object it collided with

class RigidBodyWrapper : public HybridObject {
public:
  explicit RigidBodyWrapper(double mass, std::shared_ptr<btCollisionShape> shape, std::unique_ptr<btMotionState> motionState,
                            std::string id, std::optional<CollisionCallback> collisionCallback);

  // These create functions are wrapper around the constructor and will create the motion state and then construct the RigidBodyWrapper
  static std::shared_ptr<RigidBodyWrapper> create(double mass, double x, double y, double z, std::shared_ptr<btCollisionShape> shape,
                                                  std::string id, std::optional<CollisionCallback> collisionCallback);
  static std::shared_ptr<RigidBodyWrapper> create(double mass, std::shared_ptr<TMat44Wrapper> entityTransform,
                                                  std::shared_ptr<btCollisionShape> shape, std::string id,
                                                  std::optional<CollisionCallback> collisionCallback);

  void loadHybridMethods() override;
  std::shared_ptr<btRigidBody> getRigidBody() {
    return _rigidBody;
  }

  void setId(std::string id);
  std::string getId();
  std::optional<CollisionCallback> getCollisionCallback();

private:
  void setDamping(double linearDamping, double angularDamping);
  void setFriction(double friction);
  double getFriction();
  void setActivationState(std::string activationState);
  std::string getActivationState();

private:
  std::string _id;
  std::optional<CollisionCallback> _collisionCallback;
  std::shared_ptr<btRigidBody> _rigidBody;
  std::shared_ptr<btCollisionShape> _shape;
  std::unique_ptr<btMotionState> _motionState;
};

} // namespace margelo
