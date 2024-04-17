//
// Created by Hanno Gödecke on 16.04.24.
//

#pragma once

#include "AnimatorWrapper.h"
#include "jsi/PointerHolder.h"

namespace margelo {
class CopiedAnimatorWrapper : public AnimatorWrapper {
public:
  // TODO(copy-animations): We currently copy animations from an asset onto another instance (different model than the original asset), we
  // should replace this with once we found a good solution discussed here: https://github.com/google/filament/issues/7622
  // In case of a copied (or self created animator) we manage the memory of the animator ourself (we do it using a shared_ptr)
  explicit CopiedAnimatorWrapper(std::shared_ptr<Animator> animator) : AnimatorWrapper(animator.get()), _animator(animator) {}

  void loadHybridMethods() override {
    AnimatorWrapper::loadHybridMethods();
    registerHybridMethod("release", &CopiedAnimatorWrapper::release, this);
  }

  void release() {
    Logger::log("CopiedAnimatorWrapper", "Manually releasing CopiedAnimatorWrapper...");
    _animator = nullptr;
  }

private:
  std::shared_ptr<Animator> _animator;
};
} // namespace margelo