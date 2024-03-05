//
// Created by Hanno Gödecke on 05.03.24.
//

#include "DiscreteDynamicWorldWrapper.h"

namespace margelo {
DiscreteDynamicWorldWrapper::DiscreteDynamicWorldWrapper(double gravityX, double gravityY, double gravityZ) {
  broadphase = std::make_unique<btDbvtBroadphase>();

  collisionConfiguration = std::make_unique<btDefaultCollisionConfiguration>();
  dispatcher = std::make_unique<btCollisionDispatcher>(collisionConfiguration.get());

  solver = std::make_unique<btSequentialImpulseConstraintSolver>();

  dynamicsWorld = std::make_unique<btDiscreteDynamicsWorld>(dispatcher.get(), broadphase.get(), solver.get(), collisionConfiguration.get());
  dynamicsWorld->setGravity(btVector3(gravityX, gravityY, gravityZ));
}

void DiscreteDynamicWorldWrapper::loadHybridMethods() {}
} // namespace margelo
