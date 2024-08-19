//
// Created by Hanno Gödecke on 19.04.24.
//

#pragma once

#include "RNFQualityLevel.h"
#include "jsi/RNFHybridObject.h"
#include <filament/Options.h>

namespace margelo {

using namespace filament;

class DynamicResolutionOptionsWrapper : public margelo::HybridObject, public DynamicResolutionOptions {
public:
  explicit DynamicResolutionOptionsWrapper() : HybridObject("DynamicResolutionOptions") {}
  explicit DynamicResolutionOptionsWrapper(const DynamicResolutionOptions& options)
      : HybridObject("DynamicResolutionOptions"), DynamicResolutionOptions(options) {}

  void loadHybridMethods() {
    registerHybridGetter("minScale", &DynamicResolutionOptionsWrapper::getMinScale, this);
    registerHybridSetter("minScale", &DynamicResolutionOptionsWrapper::setMinScale, this);
    registerHybridGetter("maxScale", &DynamicResolutionOptionsWrapper::getMaxScale, this);
    registerHybridSetter("maxScale", &DynamicResolutionOptionsWrapper::setMaxScale, this);
    registerHybridGetter("sharpness", &DynamicResolutionOptionsWrapper::getSharpness, this);
    registerHybridSetter("sharpness", &DynamicResolutionOptionsWrapper::setSharpness, this);
    registerHybridGetter("enabled", &DynamicResolutionOptionsWrapper::getEnabled, this);
    registerHybridSetter("enabled", &DynamicResolutionOptionsWrapper::setEnabled, this);
    registerHybridGetter("homogeneousScaling", &DynamicResolutionOptionsWrapper::getHomogeneousScaling, this);
    registerHybridSetter("homogeneousScaling", &DynamicResolutionOptionsWrapper::setHomogeneousScaling, this);
    registerHybridGetter("quality", &DynamicResolutionOptionsWrapper::getQuality, this);
    registerHybridSetter("quality", &DynamicResolutionOptionsWrapper::setQuality, this);
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
