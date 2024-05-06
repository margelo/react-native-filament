#pragma once

#include "AmbientOcclusionOptionsWrapper.h"
#include "AntiAliasingEnum.h"
#include "CameraWrapper.h"
#include "DitheringEnum.h"
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
  explicit ViewWrapper(std::shared_ptr<View> view, float densityPixelRatio)
      : PointerHolder("ViewWrapper", view), _densityPixelRatio(densityPixelRatio) {}

  void loadHybridMethods() override;

private:
  double getAspectRatio();
  std::shared_ptr<AmbientOcclusionOptionsWrapper> createAmbientOcclusionOptions();
  void setAmbientOcclusionOptions(std::shared_ptr<AmbientOcclusionOptionsWrapper> options);
  std::shared_ptr<AmbientOcclusionOptionsWrapper> getAmbientOcclusionOptions();
  std::shared_ptr<DynamicResolutionOptionsWrapper> createDynamicResolutionOptions();
  void setDynamicResolutionOptions(std::shared_ptr<DynamicResolutionOptionsWrapper> options);
  std::shared_ptr<DynamicResolutionOptionsWrapper> getDynamicResolutionOptions();
  void setPostProcessingEnabled(bool enabled);
  bool isPostProcessingEnabled();
  void setScreenSpaceRefractionEnabled(bool enabled);
  bool isScreenSpaceRefractionEnabled();
  bool isShadowingEnabled();
  void setShadowingEnabled(bool enabled);
  std::string getDithering();
  void setDithering(const std::string& dithering);
  std::string getAntiAliasing();
  void setAntiAliasing(const std::string& antiAliasing);
  std::vector<double> projectWorldToScreen(std::vector<double> worldCoordinates);
  std::future<std::optional<std::shared_ptr<EntityWrapper>>> pickEntity(double x, double y);

private:
  std::mutex _mutex;
  std::shared_ptr<Scene> _scene;
  std::shared_ptr<Camera> _camera;
  float _densityPixelRatio;

private:
  static constexpr auto TAG = "ViewWrapper";
};
} // namespace margelo
