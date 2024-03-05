//
// Created by Hanno Gödecke on 05.03.24.
//

#pragma once

#include "DiscreteDynamicWorldWrapper.h"
#include "jsi/HybridObject.h"

namespace margelo {

// Main Wrapper for all Bullet Physics related APIs
class BulletWrapper : public HybridObject {
public:
  void loadHybridMethods() override;

private:
  std::shared_ptr<DiscreteDynamicWorldWrapper> createDiscreteDynamicWorld(double gravityX, double gravityY, double gravityZ);
};

} // namespace margelo

