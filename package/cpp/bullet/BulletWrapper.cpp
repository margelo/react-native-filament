//
// Created by Hanno Gödecke on 05.03.24.
//

#include "BulletWrapper.h"

namespace margelo {

void BulletWrapper::loadHybridMethods() {
  registerHybridMethod("createDiscreteDynamicWorld", &BulletWrapper::createDiscreteDynamicWorld, this);
}

std::shared_ptr<DiscreteDynamicWorldWrapper> BulletWrapper::createDiscreteDynamicWorld(double gravityX, double gravityY, double gravityZ) {
  return std::make_shared<DiscreteDynamicWorldWrapper>(gravityX, gravityY, gravityZ);
}
} // namespace margelo