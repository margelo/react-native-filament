//
// Created by Hanno Gödecke on 12.04.24.
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

class AmbientOcclusionOptionsWrapper : public nitro::HybridObject, public AmbientOcclusionOptions {
public:
  explicit AmbientOcclusionOptionsWrapper() : HybridObject("AmbientOcclusionOptionsWrapper") {}
  explicit AmbientOcclusionOptionsWrapper(const AmbientOcclusionOptions& options)
      : HybridObject("AmbientOcclusionOptionsWrapper"), AmbientOcclusionOptions(options) {}

  void loadHybridMethods() override {
    HybridObject::loadHybridMethods();
    registerHybrids(this, [](nitro::Prototype& proto) {
      proto.registerHybridGetter("radius", &AmbientOcclusionOptionsWrapper::getRadius);
      proto.registerHybridSetter("radius", &AmbientOcclusionOptionsWrapper::setRadius);
      proto.registerHybridGetter("power", &AmbientOcclusionOptionsWrapper::getPower);
      proto.registerHybridSetter("power", &AmbientOcclusionOptionsWrapper::setPower);
      proto.registerHybridGetter("bias", &AmbientOcclusionOptionsWrapper::getBias);
      proto.registerHybridSetter("bias", &AmbientOcclusionOptionsWrapper::setBias);
      proto.registerHybridGetter("resolution", &AmbientOcclusionOptionsWrapper::getResolution);
      proto.registerHybridSetter("resolution", &AmbientOcclusionOptionsWrapper::setResolution);
      proto.registerHybridGetter("intensity", &AmbientOcclusionOptionsWrapper::getIntensity);
      proto.registerHybridSetter("intensity", &AmbientOcclusionOptionsWrapper::setIntensity);
      proto.registerHybridGetter("bilateralThreshold", &AmbientOcclusionOptionsWrapper::getBilateralThreshold);
      proto.registerHybridSetter("bilateralThreshold", &AmbientOcclusionOptionsWrapper::setBilateralThreshold);
      proto.registerHybridGetter("quality", &AmbientOcclusionOptionsWrapper::getQuality);
      proto.registerHybridSetter("quality", &AmbientOcclusionOptionsWrapper::setQuality);
      proto.registerHybridGetter("lowPassFilter", &AmbientOcclusionOptionsWrapper::getLowPassFilter);
      proto.registerHybridSetter("lowPassFilter", &AmbientOcclusionOptionsWrapper::setLowPassFilter);
      proto.registerHybridGetter("upsampling", &AmbientOcclusionOptionsWrapper::getUpsampling);
      proto.registerHybridSetter("upsampling", &AmbientOcclusionOptionsWrapper::setUpsampling);
      proto.registerHybridGetter("enabled", &AmbientOcclusionOptionsWrapper::getEnabled);
      proto.registerHybridSetter("enabled", &AmbientOcclusionOptionsWrapper::setEnabled);
      proto.registerHybridGetter("bentNormals", &AmbientOcclusionOptionsWrapper::getBentNormals);
      proto.registerHybridSetter("bentNormals", &AmbientOcclusionOptionsWrapper::setBentNormals);
      proto.registerHybridGetter("minHorizonAngleRad", &AmbientOcclusionOptionsWrapper::getMinHorizonAngleRad);
      proto.registerHybridSetter("minHorizonAngleRad", &AmbientOcclusionOptionsWrapper::setMinHorizonAngleRad);
    });
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
