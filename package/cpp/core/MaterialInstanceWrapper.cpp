//
// Created by Hanno Gödecke on 20.03.24.
//

#include "MaterialInstanceWrapper.h"
#include "CullingModeEnum.h"
#include "TransparencyModeEnum.h"
#include <filament/Material.h>

namespace margelo {
void MaterialInstanceWrapper::loadHybridMethods() {
  registerHybridMethod("setCullingMode", &MaterialInstanceWrapper::setCullingMode, this);
  registerHybridMethod("setTransparencyMode", &MaterialInstanceWrapper::setTransparencyMode, this);
  registerHybridMethod("changeAlpha", &MaterialInstanceWrapper::changeAlpha, this);
}

void MaterialInstanceWrapper::setCullingMode(std::string mode) {
  backend::CullingMode cullingMode;
  EnumMapper::convertJSUnionToEnum(mode, &cullingMode);
  _materialInstance->setCullingMode(cullingMode);
}

void MaterialInstanceWrapper::setTransparencyMode(std::string mode) {
  TransparencyMode transparencyMode;
  EnumMapper::convertJSUnionToEnum(mode, &transparencyMode);
  _materialInstance->setTransparencyMode(transparencyMode);
}

void MaterialInstanceWrapper::changeAlpha(MaterialInstance* materialInstance, double alpha) {
  // Check if blend mode supports alpha
  const Material* material = materialInstance->getMaterial();
  BlendingMode blendMode = material->getBlendingMode();
  if (blendMode == BlendingMode::OPAQUE) {
    [[unlikely]] throw new std::runtime_error(
        "Trying to change alpha on an opaque material. Set the material to a transparent mode first.");
  }
  // Clip alpha to 0-1
  alpha = std::clamp(alpha, 0.0, 1.0);

  // Customer's default:
  materialInstance->setTransparencyMode(TransparencyMode::TWO_PASSES_ONE_SIDE);

  math::float4 rgba = materialInstance->getParameter<math::float4>("baseColorFactor");
  materialInstance->setParameter("baseColorFactor", math::float4({rgba.r, rgba.g, rgba.b, alpha}));
}

void MaterialInstanceWrapper::changeAlpha(double alpha) {
  changeAlpha(_materialInstance, alpha);
}

} // namespace margelo