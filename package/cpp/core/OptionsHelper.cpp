//
// Created by Hanno Gödecke on 12.04.24.
//

#include "OptionsHelper.h"

namespace margelo {

void OptionsHelper::loadHybridMethods() {
  registerHybridMethod("createAmbientOcclusionOptions", &OptionsHelper::createAmbientOcclusionOptions, this);
}

std::shared_ptr<AmbientOcclusionOptionsWrapper> OptionsHelper::createAmbientOcclusionOptions() {
  return std::make_shared<AmbientOcclusionOptionsWrapper>();
}

} // namespace margelo