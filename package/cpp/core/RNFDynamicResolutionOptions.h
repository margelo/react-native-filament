//
// Created by Hanno Gödecke on 19.04.24.
//

#pragma once

#include "RNFQualityLevel.h"
#if __has_include(<NitroModules/HybridObject.hpp>)
#include <NitroModules/HybridObject.hpp>
#else
#error NitroModules cannot be found! Are you sure you installed NitroModules properly?
#endif
#include <filament/Options.h>

namespace margelo {

using namespace filament;

class DynamicResolutionOptionsWrapper : public nitro::HybridObject, public DynamicResolutionOptions {
public:
  explicit DynamicResolutionOptionsWrapper() : HybridObject("DynamicResolutionOptions") {}
  explicit DynamicResolutionOptionsWrapper(const DynamicResolutionOptions& options)
      : HybridObject("DynamicResolutionOptions"), DynamicResolutionOptions(options) {}

  void loadHybridMethods() {
    HybridObject::loadHybridMethods();
    registerHybrids(this, [](nitro::Prototype& proto) {
      proto.registerHybridGetter("minScale", &DynamicResolutionOptionsWrapper::getMinScale);
      proto.registerHybridSetter("minScale", &DynamicResolutionOptionsWrapper::setMinScale);
      proto.registerHybridGetter("maxScale", &DynamicResolutionOptionsWrapper::getMaxScale);
      proto.registerHybridSetter("maxScale", &DynamicResolutionOptionsWrapper::setMaxScale);
      proto.registerHybridGetter("sharpness", &DynamicResolutionOptionsWrapper::getSharpness);
      proto.registerHybridSetter("sharpness", &DynamicResolutionOptionsWrapper::setSharpness);
      proto.registerHybridGetter("enabled", &DynamicResolutionOptionsWrapper::getEnabled);
      proto.registerHybridSetter("enabled", &DynamicResolutionOptionsWrapper::setEnabled);
      proto.registerHybridGetter("homogeneousScaling", &DynamicResolutionOptionsWrapper::getHomogeneousScaling);
      proto.registerHybridSetter("homogeneousScaling", &DynamicResolutionOptionsWrapper::setHomogeneousScaling);
      proto.registerHybridGetter("quality", &DynamicResolutionOptionsWrapper::getQuality);
      proto.registerHybridSetter("quality", &DynamicResolutionOptionsWrapper::setQuality);
    });
  }

private:
  // Getter and Setter for minScale
  std::vector<float> getMinScale() {
    return {minScale.x, minScale.y};
  }
  void setMinScale(const std::vector<float>& scale) {
    if (scale.size() != 2)
      throw std::invalid_argument("Expected exactly two values for scale.");
    minScale = {scale[0], scale[1]};
  }

  // Getter and Setter for maxScale
  std::vector<float> getMaxScale() {
    return {maxScale.x, maxScale.y};
  }
  void setMaxScale(const std::vector<float>& scale) {
    if (scale.size() != 2)
      throw std::invalid_argument("Expected exactly two values for scale.");
    maxScale = {scale[0], scale[1]};
  }

  // Getter and Setter for sharpness
  float getSharpness() {
    return sharpness;
  }
  void setSharpness(float sharpnessValue) {
    sharpness = sharpnessValue;
  }

  // Getter and Setter for enabled
  bool getEnabled() {
    return enabled;
  }
  void setEnabled(bool enable) {
    enabled = enable;
  }

  // Getter and Setter for homogeneousScaling
  bool getHomogeneousScaling() {
    return homogeneousScaling;
  }
  void setHomogeneousScaling(bool homogeneous) {
    homogeneousScaling = homogeneous;
  }

  // Getter and Setter for quality
  std::string getQuality() {
    std::string qualityStr;
    EnumMapper::convertEnumToJSUnion(quality, &qualityStr);
    return qualityStr;
  }
  void setQuality(std::string qualityValue) {
    EnumMapper::convertJSUnionToEnum(qualityValue, &this->quality);
  }
};

} // namespace margelo
