//
// Created by Hanno Gödecke on 15.03.24.
//

#pragma once

#include "core/utils/EntityWrapper.h"
#include <filament/TransformManager.h>
#include <jsi/HybridObject.h>

namespace margelo {

class TransformManagerWrapper : public HybridObject {
public:
  explicit TransformManagerWrapper(filament::TransformManager& transformManager)
      : HybridObject("TransformManagerWrapper"), _transformManager(transformManager) {}

  void loadHybridMethods() override;

  const filament::TransformManager& getTransformManager() {
    return _transformManager;
  }

private:
  int getTransform(std::shared_ptr<EntityWrapper> entity);

private:
  filament::TransformManager& _transformManager;
};

} // namespace margelo
