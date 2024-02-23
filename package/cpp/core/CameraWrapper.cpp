#include "CameraWrapper.h"

margelo::CameraWrapper::~CameraWrapper() {
  // TODO: engine.destroyCameraComponent(myCameraEntity);
  _camera = nullptr;
}

void margelo::CameraWrapper::loadHybridMethods() {
  // TODO: implement
}
