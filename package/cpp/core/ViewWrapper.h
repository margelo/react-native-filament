#pragma once

#include "AmbientOcclusionOptionsWrapper.h"
#include "CameraWrapper.h"
#include "QualityLevel.h"
#include "SceneWrapper.h"
#include "jsi/HybridObject.h"

#include <filament/View.h>
#include <filament/Viewport.h>

namespace margelo {
using namespace filament;

class ViewWrapper : public HybridObject {
public:
  explicit ViewWrapper(const std::shared_ptr<View>& view) : HybridObject("ViewWrapper"), _view(view) {}

  void loadHybridMethods() override;

  const std::shared_ptr<View>& getView() {
    return _view;
  }

  void setViewport(int x, int y, int width, int height);

private:
  void setScene(const std::shared_ptr<SceneWrapper>& scene);
  const std::shared_ptr<SceneWrapper>& getScene();
  void setCamera(const std::shared_ptr<CameraWrapper>& camera);
  const std::shared_ptr<CameraWrapper>& getCamera();
  double getAspectRatio();
  std::shared_ptr<AmbientOcclusionOptionsWrapper> createAmbientOcclusionOptions();
  void setAmbientOcclusionOptions(std::shared_ptr<AmbientOcclusionOptionsWrapper> options);
  std::shared_ptr<AmbientOcclusionOptionsWrapper> getAmbientOcclusionOptions();

private:
  std::mutex _mutex;
  std::shared_ptr<View> _view;
  std::shared_ptr<SceneWrapper> _scene;
  std::shared_ptr<CameraWrapper> _camera;
};
} // namespace margelo
