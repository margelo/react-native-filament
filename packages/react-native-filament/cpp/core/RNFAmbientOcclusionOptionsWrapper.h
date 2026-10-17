//
// Created by Hanno Gödecke on 12.04.24.
//

#pragma once

#include "RNFQualityLevel.h"
#include "jsi/RNFHybridObject.h"
#include <filament/Options.h>

namespace margelo {

using namespace filament;

class AmbientOcclusionOptionsWrapper : public HybridObject, public AmbientOcclusionOptions {
public:
  explicit AmbientOcclusionOptionsWrapper() : HybridObject("AmbientOcclusionOptionsWrapper") {}
  explicit AmbientOcclusionOptionsWrapper(const AmbientOcclusionOptions& options)
      : HybridObject("AmbientOcclusionOptionsWrapper"), AmbientOcclusionOptions(options) {}

  void loadHybridMethods() override {
    registerHybridGetter("radius", &AmbientOcclusionOptionsWrapper::getRadius, this);
    registerHybridSetter("radius", &AmbientOcclusionOptionsWrapper::setRadius, this);
    registerHybridGetter("power", &AmbientOcclusionOptionsWrapper::getPower, this);
    registerHybridSetter("power", &AmbientOcclusionOptionsWrapper::setPower, this);
    registerHybridGetter("bias", &AmbientOcclusionOptionsWrapper::getBias, this);
    registerHybridSetter("bias", &AmbientOcclusionOptionsWrapper::setBias, this);
    registerHybridGetter("resolution", &AmbientOcclusionOptionsWrapper::getResolution, this);
    registerHybridSetter("resolution", &AmbientOcclusionOptionsWrapper::setResolution, this);
    registerHybridGetter("intensity", &AmbientOcclusionOptionsWrapper::getIntensity, this);
    registerHybridSetter("intensity", &AmbientOcclusionOptionsWrapper::setIntensity, this);
    registerHybridGetter("bilateralThreshold", &AmbientOcclusionOptionsWrapper::getBilateralThreshold, this);
    registerHybridSetter("bilateralThreshold", &AmbientOcclusionOptionsWrapper::setBilateralThreshold, this);
    registerHybridGetter("quality", &AmbientOcclusionOptionsWrapper::getQuality, this);
    registerHybridSetter("quality", &AmbientOcclusionOptionsWrapper::setQuality, this);
    registerHybridGetter("lowPassFilter", &AmbientOcclusionOptionsWrapper::getLowPassFilter, this);
    registerHybridSetter("lowPassFilter", &AmbientOcclusionOptionsWrapper::setLowPassFilter, this);
    registerHybridGetter("upsampling", &AmbientOcclusionOptionsWrapper::getUpsampling, this);
    registerHybridSetter("upsampling", &AmbientOcclusionOptionsWrapper::setUpsampling, this);
    registerHybridGetter("enabled", &AmbientOcclusionOptionsWrapper::getEnabled, this);
    registerHybridSetter("enabled", &AmbientOcclusionOptionsWrapper::setEnabled, this);
    registerHybridGetter("bentNormals", &AmbientOcclusionOptionsWrapper::getBentNormals, this);
    registerHybridSetter("bentNormals", &AmbientOcclusionOptionsWrapper::setBentNormals, this);
    registerHybridGetter("minHorizonAngleRad", &AmbientOcclusionOptionsWrapper::getMinHorizonAngleRad, this);
    registerHybridSetter("minHorizonAngleRad", &AmbientOcclusionOptionsWrapper::setMinHorizonAngleRad, this);
  }

private:
  // Getter and Setter for radius
  float getRadius() {
    return radius;
  }
  void setRadius(float radius) {
    this->radius = radius;
  }

  // Getter and Setter for power
  float getPower() {
    return power;
  }
  void setPower(float power) {
    this->power = power;
  }

  // Getter and Setter for bias
  float getBias() {
    return bias;
  }
  void setBias(float bias) {
    this->bias = bias;
  }

  // Getter and Setter for resolution
  float getResolution() {
    return resolution;
  }
  void setResolution(float resolution) {
    this->resolution = resolution;
  }

  // Getter and Setter for intensity
  float getIntensity() {
    return intensity;
  }
  void setIntensity(float intensity) {
    this->intensity = intensity;
  }

  // Getter and Setter for bilateralThreshold
  float getBilateralThreshold() {
    return bilateralThreshold;
  }
  void setBilateralThreshold(float bilateralThreshold) {
    this->bilateralThreshold = bilateralThreshold;
  }

  // Getter and Setter for quality
  std::string getQuality() {
    std::string qualityStr;
    EnumMapper::convertEnumToJSUnion(quality, &qualityStr);
    return qualityStr;
  }
  void setQuality(std::string quality) {
    EnumMapper::convertJSUnionToEnum(quality, &this->quality);
  }

  // Getter and Setter for lowPassFilter
  std::string getLowPassFilter() {
    std::string lowPassFilterStr;
    EnumMapper::convertEnumToJSUnion(lowPassFilter, &lowPassFilterStr);
    return lowPassFilterStr;
  }
  void setLowPassFilter(std::string lowPassFilter) {
    EnumMapper::convertJSUnionToEnum(lowPassFilter, &this->lowPassFilter);
  }

  // Getter and Setter for upsampling
  std::string getUpsampling() {
    std::string upsamplingStr;
    EnumMapper::convertEnumToJSUnion(upsampling, &upsamplingStr);
    return upsamplingStr;
  }
  void setUpsampling(std::string upsampling) {
    EnumMapper::convertJSUnionToEnum(upsampling, &this->upsampling);
  }

  // Getter and Setter for enabled
  bool getEnabled() {
    return enabled;
  }
  void setEnabled(bool enabled) {
    this->enabled = enabled;
  }

  // Getter and Setter for bentNormals
  bool getBentNormals() {
    return bentNormals;
  }
  void setBentNormals(bool bentNormals) {
    this->bentNormals = bentNormals;
  }

  // Getter and Setter for minHorizonAngleRad
  float getMinHorizonAngleRad() {
    return minHorizonAngleRad;
  }
  void setMinHorizonAngleRad(float minHorizonAngleRad) {
    this->minHorizonAngleRad = minHorizonAngleRad;
  }
};
} // namespace margelo
