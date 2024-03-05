#include "ViewWrapper.h"

namespace margelo {

void ViewWrapper::loadHybridMethods() {
  registerHybridSetter("scene", &ViewWrapper::setScene, this);
  registerHybridGetter("scene", &ViewWrapper::getScene, this);
  registerHybridSetter("camera", &ViewWrapper::setCamera, this);
  registerHybridGetter("camera", &ViewWrapper::getCamera, this);
  registerHybridMethod("setViewport", &ViewWrapper::setViewport, this);
  registerHybridGetter("aspectRatio", &ViewWrapper::getAspectRatio, this);
}

void ViewWrapper::setScene(std::shared_ptr<SceneWrapper> scene) {
  if (!scene) {
    throw std::invalid_argument("Scene is null");
  }

  _scene = scene;
  _view->setScene(scene->getScene().get());
}

std::shared_ptr<SceneWrapper> ViewWrapper::getScene() {
  return _scene;
}

void ViewWrapper::setCamera(std::shared_ptr<CameraWrapper> camera) {
  if (!camera) {
    throw std::invalid_argument("Camera is null");
  }

  _camera = camera;
  _view->setCamera(camera->getCamera().get());
}

std::shared_ptr<CameraWrapper> ViewWrapper::getCamera() {
  return _camera;
}

void ViewWrapper::setViewport(int x, int y, int width, int height) {
  if (width < 0 || height < 0) {
    throw std::invalid_argument("Invalid viewport size");
  }

  _view->setViewport({x, y, static_cast<uint32_t>(width), static_cast<uint32_t>(height)});
}

double ViewWrapper::getAspectRatio() {
  return (double)_view->getViewport().width / _view->getViewport().height;
}

} // namespace margelo
