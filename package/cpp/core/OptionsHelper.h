//
// Created by Hanno Gödecke on 12.04.24.
//

#pragma once

#include "AmbientOcclusionOptionsWrapper.h"
#include "jsi/HybridObject.h"

namespace margelo {

class OptionsHelper : public HybridObject {
public:
  explicit OptionsHelper() : HybridObject("OptionsHelper") {}

  void loadHybridMethods() override;

private:
  std::shared_ptr<AmbientOcclusionOptionsWrapper> createAmbientOcclusionOptions();
};

} // namespace margelo
