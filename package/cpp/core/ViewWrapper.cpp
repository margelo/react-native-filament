#include "ViewWrapper.h"

namespace margelo {

void ViewWrapper::loadHybridMethods() {
  registerHybridSetter("scene", &ViewWrapper::setScene, this);
  registerHybridGetter("scene", &ViewWrapper::getScene, this);
  registerHybridSetter("camera", &ViewWrapper::setCamera, this);
  registerHybridGetter("camera", &ViewWrapper::getCamera, this);
  registerHybridMethod("setViewport", &ViewWrapper::setViewport, this);
  registerHybridMethod("getAspectRatio", &ViewWrapper::getAspectRatio, this);
  registerHybridMethod("createAmbientOcclusionOptions", &ViewWrapper::createAmbientOcclusionOptions, this);
  registerHybridMethod("setAmbientOcclusionOptions", &ViewWrapper::setAmbientOcclusionOptions, this);
  registerHybridMethod("getAmbientOcclusionOptions", &ViewWrapper::getAmbientOcclusionOptions, this);
}

void ViewWrapper::setScene(const std::shared_ptr<SceneWrapper>& scene) {
  if (!scene) {
    [[unlikely]];
    throw std::invalid_argument("Scene is null");
  }

  _scene = scene;
  _view->setScene(scene->getScene().get());
}

const std::shared_ptr<SceneWrapper>& ViewWrapper::getScene() {
  return _scene;
}

void ViewWrapper::setCamera(const std::shared_ptr<CameraWrapper>& camera) {
  if (!camera) {
    [[unlikely]];
    throw std::invalid_argument("Camera is null");
  }

  _camera = camera;
  _view->setCamera(camera->getCamera().get());
}

const std::shared_ptr<CameraWrapper>& ViewWrapper::getCamera() {
  return _camera;
}

void ViewWrapper::setViewport(int x, int y, int width, int height) {
  std::unique_lock lock(_mutex);
  if (width < 0 || height < 0) {
    throw std::invalid_argument("Invalid viewport size");
  }

  _view->setViewport({x, y, static_cast<uint32_t>(width), static_cast<uint32_t>(height)});
}

double ViewWrapper::getAspectRatio() {
  uint32_t height = _view->getViewport().height;
  if (height == 0) {
    return 0;
  }
  uint32_t width = _view->getViewport().width;
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
  _view->setAmbientOcclusionOptions(*options.get());
}
std::shared_ptr<AmbientOcclusionOptionsWrapper> ViewWrapper::getAmbientOcclusionOptions() {
  return std::make_shared<AmbientOcclusionOptionsWrapper>(_view->getAmbientOcclusionOptions());
}
std::shared_ptr<AmbientOcclusionOptionsWrapper> ViewWrapper::createAmbientOcclusionOptions() {
  return std::make_shared<AmbientOcclusionOptionsWrapper>();
}

} // namespace margelo
