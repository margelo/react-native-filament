// RNFBloomOptionsWrapper.h
// Created by Hanno Gödecke on 30.06.25.

#pragma once

#include "RNFQualityLevel.h"
#include "jsi/RNFHybridObject.h"
#include <filament/Options.h>

namespace margelo {
using namespace filament;

class BloomOptionsWrapper : public HybridObject, public BloomOptions {
public:
  explicit BloomOptionsWrapper() : HybridObject("BloomOptions") {}
  explicit BloomOptionsWrapper(const BloomOptions& options) : HybridObject("BloomOptions"), BloomOptions(options) {}

  void loadHybridMethods() {
    registerHybridGetter("enabled", &BloomOptionsWrapper::getEnabled, this);
    registerHybridSetter("enabled", &BloomOptionsWrapper::setEnabled, this);
    registerHybridGetter("strength", &BloomOptionsWrapper::getStrength, this);
    registerHybridSetter("strength", &BloomOptionsWrapper::setStrength, this);
    registerHybridGetter("resolution", &BloomOptionsWrapper::getResolution, this);
    registerHybridSetter("resolution", &BloomOptionsWrapper::setResolution, this);
    registerHybridGetter("levels", &BloomOptionsWrapper::getLevels, this);
    registerHybridSetter("levels", &BloomOptionsWrapper::setLevels, this);
    registerHybridGetter("blendMode", &BloomOptionsWrapper::getBlendMode, this);
    registerHybridSetter("blendMode", &BloomOptionsWrapper::setBlendMode, this);
    registerHybridGetter("threshold", &BloomOptionsWrapper::getThreshold, this);
    registerHybridSetter("threshold", &BloomOptionsWrapper::setThreshold, this);
    registerHybridGetter("highlight", &BloomOptionsWrapper::getHighlight, this);
    registerHybridSetter("highlight", &BloomOptionsWrapper::setHighlight, this);
    registerHybridGetter("quality", &BloomOptionsWrapper::getQualityStr, this);
    registerHybridSetter("quality", &BloomOptionsWrapper::setQualityStr, this);
    registerHybridGetter("lensFlare", &BloomOptionsWrapper::getLensFlare, this);
    registerHybridSetter("lensFlare", &BloomOptionsWrapper::setLensFlare, this);
    registerHybridGetter("starburst", &BloomOptionsWrapper::getStarburst, this);
    registerHybridSetter("starburst", &BloomOptionsWrapper::setStarburst, this);
    registerHybridGetter("chromaticAberration", &BloomOptionsWrapper::getChromaticAberration, this);
    registerHybridSetter("chromaticAberration", &BloomOptionsWrapper::setChromaticAberration, this);
    registerHybridGetter("ghostCount", &BloomOptionsWrapper::getGhostCount, this);
    registerHybridSetter("ghostCount", &BloomOptionsWrapper::setGhostCount, this);
    registerHybridGetter("ghostSpacing", &BloomOptionsWrapper::getGhostSpacing, this);
    registerHybridSetter("ghostSpacing", &BloomOptionsWrapper::setGhostSpacing, this);
    registerHybridGetter("ghostThreshold", &BloomOptionsWrapper::getGhostThreshold, this);
    registerHybridSetter("ghostThreshold", &BloomOptionsWrapper::setGhostThreshold, this);
    registerHybridGetter("haloThickness", &BloomOptionsWrapper::getHaloThickness, this);
    registerHybridSetter("haloThickness", &BloomOptionsWrapper::setHaloThickness, this);
    registerHybridGetter("haloRadius", &BloomOptionsWrapper::getHaloRadius, this);
    registerHybridSetter("haloRadius", &BloomOptionsWrapper::setHaloRadius, this);
    registerHybridGetter("haloThreshold", &BloomOptionsWrapper::getHaloThreshold, this);
    registerHybridSetter("haloThreshold", &BloomOptionsWrapper::setHaloThreshold, this);
  }

private:
  bool getEnabled() {
    return enabled;
  }
  void setEnabled(bool value) {
    enabled = value;
  }

  double getStrength() {
    return static_cast<double>(strength);
  }
  void setStrength(double value) {
    strength = static_cast<float>(value);
  }

  double getResolution() {
    return static_cast<double>(resolution);
  }
  void setResolution(double value) {
    resolution = static_cast<uint32_t>(value);
  }

  double getLevels() {
    return static_cast<double>(levels);
  }
  void setLevels(double value) {
    levels = static_cast<uint8_t>(value);
  }

  // BlendMode
  std::string getBlendMode() {
    return blendMode == BloomOptions::BlendMode::ADD ? "ADD" : "INTERPOLATE";
  }
  void setBlendMode(const std::string& value) {
    if (value == "ADD")
      blendMode = BloomOptions::BlendMode::ADD;
    else if (value == "INTERPOLATE")
      blendMode = BloomOptions::BlendMode::INTERPOLATE;
    else
      throw std::invalid_argument("Invalid blendMode value");
  }

  bool getThreshold() {
    return threshold;
  }
  void setThreshold(bool value) {
    threshold = value;
  }

  double getHighlight() {
    return static_cast<double>(highlight);
  }
  void setHighlight(double value) {
    highlight = static_cast<float>(value);
  }

  std::string getQualityStr() {
    std::string qualityStr;
    EnumMapper::convertEnumToJSUnion(quality, &qualityStr);
    return qualityStr;
  }
  void setQualityStr(const std::string& value) {
    EnumMapper::convertJSUnionToEnum(value, &quality);
  }

  bool getLensFlare() {
    return lensFlare;
  }
  void setLensFlare(bool value) {
    lensFlare = value;
  }

  bool getStarburst() {
    return starburst;
  }
  void setStarburst(bool value) {
    starburst = value;
  }

  double getChromaticAberration() {
    return static_cast<double>(chromaticAberration);
  }
  void setChromaticAberration(double value) {
    chromaticAberration = static_cast<float>(value);
  }

  double getGhostCount() {
    return static_cast<double>(ghostCount);
  }
  void setGhostCount(double value) {
    ghostCount = static_cast<uint8_t>(value);
  }

  double getGhostSpacing() {
    return static_cast<double>(ghostSpacing);
  }
  void setGhostSpacing(double value) {
    ghostSpacing = static_cast<float>(value);
  }

  double getGhostThreshold() {
    return static_cast<double>(ghostThreshold);
  }
  void setGhostThreshold(double value) {
    ghostThreshold = static_cast<float>(value);
  }

  double getHaloThickness() {
    return static_cast<double>(haloThickness);
  }
  void setHaloThickness(double value) {
    haloThickness = static_cast<float>(value);
  }

  double getHaloRadius() {
    return static_cast<double>(haloRadius);
  }
  void setHaloRadius(double value) {
    haloRadius = static_cast<float>(value);
  }

  double getHaloThreshold() {
    return static_cast<double>(haloThreshold);
  }
  void setHaloThreshold(double value) {
    haloThreshold = static_cast<float>(value);
  }
};

} // namespace margelo
