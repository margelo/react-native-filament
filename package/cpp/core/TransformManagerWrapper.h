//
// Created by Hanno Gödecke on 15.03.24.
//

#pragma once

#include "core/math/TMat44Wrapper.h"
#include "core/utils/EntityWrapper.h"
#include <filament/TransformManager.h>
#include <jsi/HybridObject.h>

namespace margelo {

using namespace filament;

class TransformManagerWrapper : public HybridObject {
public:
  explicit TransformManagerWrapper(filament::TransformManager& transformManager)
      : HybridObject("TransformManagerWrapper"), _transformManager(transformManager) {}

  void loadHybridMethods() override;

private:
  std::shared_ptr<TMat44Wrapper> getTransform(std::shared_ptr<EntityWrapper> entity);
  std::shared_ptr<TMat44Wrapper> getWorldTransform(std::shared_ptr<EntityWrapper> entity);

private:
  filament::TransformManager& _transformManager;
};

} // namespace margelo
