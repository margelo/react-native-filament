#pragma once

#include "CameraWrapper.h"
#include "SceneWrapper.h"
#include "jsi/HybridObject.h"

#include <filament/View.h>
#include <filament/Viewport.h>

namespace margelo {
using namespace filament;

class ViewWrapper : public HybridObject {
public:
  explicit ViewWrapper(std::shared_ptr<View> view) : _view(view) {}

  void loadHybridMethods() override;

  std::shared_ptr<View> getView() {
    return _view;
  }

private:
  void setScene(std::shared_ptr<SceneWrapper> scene);
  std::shared_ptr<SceneWrapper> getScene();
  void setCamera(std::shared_ptr<CameraWrapper> camera);
  std::shared_ptr<CameraWrapper> getCamera();
  void setViewport(int x, int y, int width, int height);

private:
  std::shared_ptr<View> _view;
  std::shared_ptr<SceneWrapper> _scene;
  std::shared_ptr<CameraWrapper> _camera;
};
} // namespace margelo