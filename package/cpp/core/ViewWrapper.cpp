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

} // namespace margelo
