//
// Created by Hanno Gödecke on 05.03.24.
//

#include "DiscreteDynamicWorldWrapper.h"

namespace margelo {
DiscreteDynamicWorldWrapper::DiscreteDynamicWorldWrapper(double gravityX, double gravityY, double gravityZ)
    : HybridObject("DiscreteDynamicWorldWrapper") {
  broadphase = std::make_unique<btDbvtBroadphase>();

  collisionConfiguration = std::make_unique<btDefaultCollisionConfiguration>();
  dispatcher = std::make_unique<btCollisionDispatcher>(collisionConfiguration.get());

  solver = std::make_unique<btSequentialImpulseConstraintSolver>();

  dynamicsWorld = std::make_unique<btDiscreteDynamicsWorld>(dispatcher.get(), broadphase.get(), solver.get(), collisionConfiguration.get());
  dynamicsWorld->setGravity(btVector3(gravityX, gravityY, gravityZ));
}

void DiscreteDynamicWorldWrapper::loadHybridMethods() {
  registerHybridMethod("addRigidBody", &DiscreteDynamicWorldWrapper::addRigidBody, this);
  registerHybridMethod("stepSimulation", &DiscreteDynamicWorldWrapper::stepSimulation, this);
}

void DiscreteDynamicWorldWrapper::addRigidBody(std::shared_ptr<RigidBodyWrapper> rigidBody) {
  if (!rigidBody) {
    throw std::runtime_error("RigidBody is null");
  }
  btRigidBody* body = rigidBody->getRigidBody().get();
  dynamicsWorld->addRigidBody(body);
  rigidBodies->push_back(rigidBody);
}

void DiscreteDynamicWorldWrapper::stepSimulation(double timeStep, double maxSubSteps, double fixedTimeStep) {
  dynamicsWorld->stepSimulation(timeStep, maxSubSteps, fixedTimeStep);
}
} // namespace margelo
