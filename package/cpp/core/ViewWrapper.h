#pragma once

#include "AmbientOcclusionOptionsWrapper.h"
#include "CameraWrapper.h"
#include "DynamicResolutionOptions.h"
#include "QualityLevel.h"
#include "SceneWrapper.h"
#include "jsi/PointerHolder.h"

#include <filament/View.h>
#include <filament/Viewport.h>

namespace margelo {
using namespace filament;

class ViewWrapper : public PointerHolder<View> {
public:
  explicit ViewWrapper(std::shared_ptr<View> view) : PointerHolder("ViewWrapper", view) {}

  void loadHybridMethods() override;

private:
  double getAspectRatio();
  std::shared_ptr<AmbientOcclusionOptionsWrapper> createAmbientOcclusionOptions();
  void setAmbientOcclusionOptions(std::shared_ptr<AmbientOcclusionOptionsWrapper> options);
  std::shared_ptr<AmbientOcclusionOptionsWrapper> getAmbientOcclusionOptions();
  std::shared_ptr<DynamicResolutionOptionsWrapper> createDynamicResolutionOptions();
  void setDynamicResolutionOptions(std::shared_ptr<DynamicResolutionOptionsWrapper> options);
  std::shared_ptr<DynamicResolutionOptionsWrapper> getDynamicResolutionOptions();

private:
  std::mutex _mutex;
  std::shared_ptr<Scene> _scene;
  std::shared_ptr<Camera> _camera;
};
} // namespace margelo
