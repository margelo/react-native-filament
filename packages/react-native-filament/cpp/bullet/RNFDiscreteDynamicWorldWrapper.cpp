//
// Created by Hanno Gödecke on 05.03.24.
//

#include "RNFDiscreteDynamicWorldWrapper.h"

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
  registerHybridMethod("removeRigidBody", &DiscreteDynamicWorldWrapper::removeRigidBody, this);
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

void DiscreteDynamicWorldWrapper::removeRigidBody(std::shared_ptr<RigidBodyWrapper> rigidBody) {
  if (!rigidBody) {
    throw std::runtime_error("RigidBody is null");
  }
  btRigidBody* body = rigidBody->getRigidBody().get();
  dynamicsWorld->removeRigidBody(body);
  rigidBodies->erase(std::remove(rigidBodies->begin(), rigidBodies->end(), rigidBody), rigidBodies->end());
}

void DiscreteDynamicWorldWrapper::stepSimulation(double timeStep, double maxSubSteps, double fixedTimeStep) {
  dynamicsWorld->stepSimulation(timeStep, maxSubSteps, fixedTimeStep);

  // Check for collisions
  int numManifolds = dynamicsWorld->getDispatcher()->getNumManifolds();
  for (int i = 0; i < numManifolds; i++) {
    btPersistentManifold* contactManifold = dynamicsWorld->getDispatcher()->getManifoldByIndexInternal(i);
    const btCollisionObject* obA = contactManifold->getBody0();
    const btCollisionObject* obB = contactManifold->getBody1();

    bool isColliding = false;
    int numContacts = contactManifold->getNumContacts();
    for (int j = 0; j < numContacts; j++) {
      btManifoldPoint& pt = contactManifold->getContactPoint(j);
      if (pt.getDistance() < 0.f) {
        isColliding = true;
        break;
      }
    }

    if (!isColliding) {
      continue;
    }

    // Upcast to rigid bodies
    const btRigidBody* bodyA = btRigidBody::upcast(obA);
    const btRigidBody* bodyB = btRigidBody::upcast(obB);
    if (!bodyA || !bodyB) {
      Logger::log("DiscreteDynamicWorldWrapper", "Collision object is not a rigid body");
      continue;
    }
    // Find the RigidBodyWrapper ptrs from the list of rigid bodies
    std::shared_ptr<RigidBodyWrapper> rigidBodyA = nullptr;
    std::shared_ptr<RigidBodyWrapper> rigidBodyB = nullptr;
    for (auto& rb : *rigidBodies) {
      if (rb->getRigidBody().get() == bodyA) {
        rigidBodyA = rb;
      }
      if (rb->getRigidBody().get() == bodyB) {
        rigidBodyB = rb;
      }
    }

    if (!rigidBodyA || !rigidBodyB) {
      Logger::log("DiscreteDynamicWorldWrapper", "RigidBodyWrapper not found for collision object");
      continue;
    }

    // Call the collision callback
    std::optional<CollisionCallback> collisionCallbackA = rigidBodyA->getCollisionCallback();
    if (collisionCallbackA.has_value()) {
      CollisionCallback callback = collisionCallbackA.value();
      callback(rigidBodyA, rigidBodyB);
    }

    std::optional<CollisionCallback> collisionCallbackB = rigidBodyB->getCollisionCallback();
    if (collisionCallbackB.has_value()) {
      CollisionCallback callback = collisionCallbackB.value();
      std::string id = rigidBodyA->getId();
      callback(rigidBodyB, rigidBodyA);
    }
  }
}
} // namespace margelo
