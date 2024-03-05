//
// Created by Hanno Gödecke on 05.03.24.
//

#pragma once

#include "jsi/HybridObject.h"
#include <btBulletDynamicsCommon.h>
#include "ActivationStateEnum.h"

namespace margelo {

class RigidBodyWrapper : public HybridObject {
public:
  explicit RigidBodyWrapper(double mass, double x, double y, double z, double shapeX, double shapeY, double shapeZ);
  void loadHybridMethods() override;
  std::shared_ptr<btRigidBody> getRigidBody() {
    return _rigidBody;
  }

private:
  void setDamping(double linearDamping, double angularDamping);
  void setFriction(double friction);
  double getFriction();
  void setActivationState(std::string activationState);
  std::string getActivationState();

private:
  std::shared_ptr<btRigidBody> _rigidBody;
};

} // namespace margelo
