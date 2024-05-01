//
// Created by Hanno Gödecke on 17.04.24.
//

#pragma once

#include "FilamentBuffer.h"
#include "MaterialImpl.h"
#include "jsi/PointerHolder.h"

namespace margelo {

class RenderableManagerWrapper;

class MaterialWrapper : public PointerHolder<MaterialImpl> {
public:
  explicit MaterialWrapper(std::shared_ptr<MaterialImpl> material) : PointerHolder("MaterialWrapper", material) {}

  void loadHybridMethods() override;

public: // Public JS API
  std::shared_ptr<MaterialInstanceWrapper> createInstance();
  std::shared_ptr<MaterialInstanceWrapper> getDefaultInstance();
  void setDefaultFloatParameter(std::string name, double value);
  void setDefaultTextureParameter(std::shared_ptr<RenderableManagerWrapper> renderableManager, std::string name,
                                  std::shared_ptr<FilamentBuffer> buffer, const std::string& textureFlags);
  void setBaseColorSRGB(std::vector<double> rgba);
  std::string getName();
};

} // namespace margelo
