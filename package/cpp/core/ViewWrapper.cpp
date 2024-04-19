#include "ViewWrapper.h"

namespace margelo {

void ViewWrapper::loadHybridMethods() {
  registerHybridMethod("getAspectRatio", &ViewWrapper::getAspectRatio, this);
  registerHybridMethod("createAmbientOcclusionOptions", &ViewWrapper::createAmbientOcclusionOptions, this);
  registerHybridMethod("setAmbientOcclusionOptions", &ViewWrapper::setAmbientOcclusionOptions, this);
  registerHybridMethod("getAmbientOcclusionOptions", &ViewWrapper::getAmbientOcclusionOptions, this);
  registerHybridMethod("createDynamicResolutionOptions", &ViewWrapper::createDynamicResolutionOptions, this);
  registerHybridMethod("setDynamicResolutionOptions", &ViewWrapper::setDynamicResolutionOptions, this);
  registerHybridMethod("getDynamicResolutionOptions", &ViewWrapper::getDynamicResolutionOptions, this);
  registerHybridGetter("screenSpaceRefraction", &ViewWrapper::isScreenSpaceRefractionEnabled, this);
  registerHybridSetter("screenSpaceRefraction", &ViewWrapper::setScreenSpaceRefractionEnabled, this);
  registerHybridGetter("postProcessing", &ViewWrapper::isPostProcessingEnabled, this);
  registerHybridSetter("postProcessing", &ViewWrapper::setPostProcessingEnabled, this);
  registerHybridGetter("shadowing", &ViewWrapper::isShadowingEnabled, this);
  registerHybridSetter("shadowing", &ViewWrapper::setShadowingEnabled, this);
  registerHybridGetter("dithering", &ViewWrapper::getDithering, this);
  registerHybridSetter("dithering", &ViewWrapper::setDithering, this);
  registerHybridGetter("antiAliasing", &ViewWrapper::getAntiAliasing, this);
  registerHybridSetter("antiAliasing", &ViewWrapper::setAntiAliasing, this);
}

double ViewWrapper::getAspectRatio() {
  uint32_t height = pointee()->getViewport().height;
  if (height == 0) {
    return 0;
  }
  uint32_t width = pointee()->getViewport().width;
  if (width == 0) {
    return 0;
  }

  return (double)width / height;
}

void ViewWrapper::setAmbientOcclusionOptions(std::shared_ptr<AmbientOcclusionOptionsWrapper> options) {
  if (!options) {
    [[unlikely]];
    throw std::invalid_argument("AmbientOcclusionOptions is null");
  }
  std::unique_lock lock(_mutex);
  pointee()->setAmbientOcclusionOptions(*options.get());
}

std::shared_ptr<AmbientOcclusionOptionsWrapper> ViewWrapper::getAmbientOcclusionOptions() {
  return std::make_shared<AmbientOcclusionOptionsWrapper>(pointee()->getAmbientOcclusionOptions());
}

std::shared_ptr<AmbientOcclusionOptionsWrapper> ViewWrapper::createAmbientOcclusionOptions() {
  return std::make_shared<AmbientOcclusionOptionsWrapper>();
}

std::shared_ptr<DynamicResolutionOptionsWrapper> ViewWrapper::createDynamicResolutionOptions() {
  return std::make_shared<DynamicResolutionOptionsWrapper>();
}

void ViewWrapper::setDynamicResolutionOptions(std::shared_ptr<DynamicResolutionOptionsWrapper> options) {
  if (!options) {
    [[unlikely]];
    throw std::invalid_argument("DynamicResolutionOptions is null");
  }
  std::unique_lock lock(_mutex);
  pointee()->setDynamicResolutionOptions(*options.get());
}

std::shared_ptr<DynamicResolutionOptionsWrapper> ViewWrapper::getDynamicResolutionOptions() {
  return std::make_shared<DynamicResolutionOptionsWrapper>(pointee()->getDynamicResolutionOptions());
}

void ViewWrapper::setPostProcessingEnabled(bool enabled) {
  pointee()->setPostProcessingEnabled(enabled);
}

bool ViewWrapper::isPostProcessingEnabled() {
  return pointee()->isPostProcessingEnabled();
}

void ViewWrapper::setScreenSpaceRefractionEnabled(bool enabled) {
  pointee()->setScreenSpaceRefractionEnabled(enabled);
}

bool ViewWrapper::isScreenSpaceRefractionEnabled() {
  return pointee()->isScreenSpaceRefractionEnabled();
}

bool ViewWrapper::isShadowingEnabled() {
  return pointee()->isShadowingEnabled();
}

void ViewWrapper::setShadowingEnabled(bool enabled) {
  pointee()->setShadowingEnabled(enabled);
}

std::string ViewWrapper::getDithering() {
  std::string ditheringStr;
  EnumMapper::convertEnumToJSUnion(pointee()->getDithering(), &ditheringStr);
  return ditheringStr;
}

void ViewWrapper::setDithering(const std::string& dithering) {
  Dithering ditheringEnum;
  EnumMapper::convertJSUnionToEnum(dithering, &ditheringEnum);
  pointee()->setDithering(ditheringEnum);
}

std::string ViewWrapper::getAntiAliasing() {
  std::string antiAliasingStr;
  EnumMapper::convertEnumToJSUnion(pointee()->getAntiAliasing(), &antiAliasingStr);
  return antiAliasingStr;
}

void ViewWrapper::setAntiAliasing(const std::string& antiAliasing) {
  AntiAliasing antiAliasingEnum;
  EnumMapper::convertJSUnionToEnum(antiAliasing, &antiAliasingEnum);
  pointee()->setAntiAliasing(antiAliasingEnum);
}

} // namespace margelo
