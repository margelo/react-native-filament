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

  // Check for collisions
  int numManifolds = dynamicsWorld->getDispatcher()->getNumManifolds();
  bool isColliding = false;
  for (int i = 0; i < numManifolds; i++) {
    btPersistentManifold* contactManifold = dynamicsWorld->getDispatcher()->getManifoldByIndexInternal(i);
    const btCollisionObject* obA = contactManifold->getBody0();
    const btCollisionObject* obB = contactManifold->getBody1();

    int numContacts = contactManifold->getNumContacts();
    for (int j = 0; j < numContacts; j++) {
      btManifoldPoint& pt = contactManifold->getContactPoint(j);
      if (pt.getDistance() < 0.f) {
        isColliding = true;
        break;
      }
    }
  }

  if (!isColliding) {
    return;
  }
}
} // namespace margelo
