// RNFBloomOptionsWrapper.h
// Created by Hanno Gödecke on 30.06.25.

#pragma once

#include "jsi/RNFHybridObject.h"
#include "RNFQualityLevel.h"
#include <filament/Options.h>

namespace margelo {
using namespace filament;

class BloomOptionsWrapper : public HybridObject, public BloomOptions {
public:
  explicit BloomOptionsWrapper() : HybridObject("BloomOptions") {}
  explicit BloomOptionsWrapper(const BloomOptions& options)
      : HybridObject("BloomOptions"), BloomOptions(options) {}

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
    registerHybridGetter("quality", &BloomOptionsWrapper::getQuality, this);
    registerHybridSetter("quality", &BloomOptionsWrapper::setQuality, this);
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
  bool getEnabled() { return enabled; }
  void setEnabled(bool value) { enabled = value; }

  float getStrength() { return strength; }
  void setStrength(float value) { strength = value; }

  uint32_t getResolution() { return resolution; }
  void setResolution(uint32_t value) { resolution = value; }

  uint8_t getLevels() { return levels; }
  void setLevels(uint8_t value) { levels = value; }

  // BlendMode
  std::string getBlendMode() {
    return blendMode == BloomOptions::BlendMode::ADD ? "ADD" : "INTERPOLATE";
  }
  void setBlendMode(const std::string& value) {
    if (value == "ADD") blendMode = BloomOptions::BlendMode::ADD;
    else if (value == "INTERPOLATE") blendMode = BloomOptions::BlendMode::INTERPOLATE;
    else throw std::invalid_argument("Invalid blendMode value");
  }

  bool getThreshold() { return threshold; }
  void setThreshold(bool value) { threshold = value; }

  float getHighlight() { return highlight; }
  void setHighlight(float value) { highlight = value; }

  bool getLensFlare() { return lensFlare; }
  void setLensFlare(bool value) { lensFlare = value; }

  bool getStarburst() { return starburst; }
  void setStarburst(bool value) { starburst = value; }

  float getChromaticAberration() { return chromaticAberration; }
  void setChromaticAberration(float value) { chromaticAberration = value; }

  uint8_t getGhostCount() { return ghostCount; }
  void setGhostCount(uint8_t value) { ghostCount = value; }

  float getGhostSpacing() { return ghostSpacing; }
  void setGhostSpacing(float value) { ghostSpacing = value; }

  float getGhostThreshold() { return ghostThreshold; }
  void setGhostThreshold(float value) { ghostThreshold = value; }

  float getHaloThickness() { return haloThickness; }
  void setHaloThickness(float value) { haloThickness = value; }

  float getHaloRadius() { return haloRadius; }
  void setHaloRadius(float value) { haloRadius = value; }

  float getHaloThreshold() { return haloThreshold; }
  void setHaloThreshold(float value) { haloThreshold = value; }
};

} // namespace margelo
