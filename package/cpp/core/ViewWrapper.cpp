#include "ViewWrapper.h"

namespace margelo {

void ViewWrapper::loadHybridMethods() {
  registerHybridMethod("getAspectRatio", &ViewWrapper::getAspectRatio, this);
  registerHybridMethod("createAmbientOcclusionOptions", &ViewWrapper::createAmbientOcclusionOptions, this);
  registerHybridMethod("setAmbientOcclusionOptions", &ViewWrapper::setAmbientOcclusionOptions, this);
  registerHybridMethod("getAmbientOcclusionOptions", &ViewWrapper::getAmbientOcclusionOptions, this);
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

} // namespace margelo
