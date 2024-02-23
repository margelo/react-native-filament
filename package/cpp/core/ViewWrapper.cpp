#include "ViewWrapper.h"

namespace margelo {

void ViewWrapper::loadHybridMethods() {
  registerHybridSetter("scene", &ViewWrapper::setScene, this);
  registerHybridGetter("scene", &ViewWrapper::getScene, this);
  registerHybridSetter("camera", &ViewWrapper::setCamera, this);
  registerHybridGetter("camera", &ViewWrapper::getCamera, this);
  registerHybridMethod("setViewport", &ViewWrapper::setViewport, this);
}

void ViewWrapper::setScene(std::shared_ptr<SceneWrapper> scene) {
  _scene = scene;
  _view->setScene(scene->getScene().get());
}

std::shared_ptr<SceneWrapper> ViewWrapper::getScene() {
  return _scene;
}

void ViewWrapper::setCamera(std::shared_ptr<CameraWrapper> camera) {
  _camera = camera;
  _view->setCamera(camera->getCamera().get());
}

std::shared_ptr<CameraWrapper> ViewWrapper::getCamera() {
  return _camera;
}

void ViewWrapper::setViewport(int x, int y, int width, int height) {
  _view->setViewport({x, y, static_cast<uint32_t>(width), static_cast<uint32_t>(height)});
}

} // namespace margelo
