#pragma once

#include "EngineCore.hpp"
#include "HybridEngineSpec.hpp"
#include "assets/AssetBytes.hpp"
#include "scene/LightCore.hpp"

#include <memory>

namespace margelo::nitro::filament {

class HybridEngine final : public HybridEngineSpec {
public:
  explicit HybridEngine(std::shared_ptr<EngineCore> core);
  ~HybridEngine() override;

  EngineBackend getBackend() override;
  std::shared_ptr<HybridRenderThreadSpec> getRenderThread() override;
  std::shared_ptr<HybridTransformManagerSpec> getTransformManager() override;
  std::shared_ptr<HybridLightManagerSpec> getLightManager() override;
  std::shared_ptr<HybridRenderableManagerSpec> getRenderableManager() override;
  RenderMode getRenderMode() override;
  void setRenderMode(RenderMode renderMode) override;

  std::shared_ptr<Promise<std::shared_ptr<HybridViewTargetSpec>>> createViewTarget(const std::shared_ptr<HybridFilamentViewSpec>& view,
                                                                                   const ViewTargetOptions& options) override;
  std::shared_ptr<HybridSceneSpec> createScene() override;
  std::shared_ptr<HybridCameraSpec> createCamera() override;
  std::shared_ptr<HybridSkyboxSpec> createSkybox(const std::tuple<double, double, double, double>& color) override;
  std::shared_ptr<HybridLightSpec> createDirectionalLight(const DirectionalLightOptions& options) override;
  std::shared_ptr<HybridLightSpec> createSunLight(const SunLightOptions& options) override;
  std::shared_ptr<HybridLightSpec> createPointLight(const PointLightOptions& options) override;
  std::shared_ptr<HybridLightSpec> createSpotLight(const SpotLightOptions& options) override;
  std::shared_ptr<HybridLightSpec> createFocusedSpotLight(const SpotLightOptions& options) override;
  std::shared_ptr<Promise<std::shared_ptr<HybridModelSpec>>> loadModel(const AssetSource& source, const ModelLoadOptions& options) override;
  std::shared_ptr<Promise<std::shared_ptr<HybridIndirectLightSpec>>> loadIndirectLight(const AssetSource& source,
                                                                                       const IndirectLightOptions& options) override;
  std::shared_ptr<HybridTransformBindingSpec> createTransformBinding(double entity) override;
  std::shared_ptr<HybridValueBindingSpec> createValueBinding(double initialValue) override;
  std::shared_ptr<HybridCameraManipulatorSpec> createOrbitManipulator(const OrbitManipulatorOptions& options) override;
  std::shared_ptr<HybridFrameListenerSubscriptionSpec> addOnFrameListener(const std::function<bool(const FrameInfo&)>& listener) override;
  void requestFrame() override;
  std::shared_ptr<Promise<void>> shutdown() override;
  void dispose() override;

  const std::shared_ptr<EngineCore>& core() const;

private:
  template <typename T>
  void withAssetBytes(const AssetSource& source, const std::shared_ptr<Promise<T>>& promise,
                      std::function<void(const std::shared_ptr<ArrayBuffer>& bytes)> onRenderThread);

  std::shared_ptr<EngineCore> core_;
  std::shared_ptr<HybridRenderThreadSpec> renderThread_;
  std::shared_ptr<HybridTransformManagerSpec> transformManager_;
  std::shared_ptr<HybridLightManagerSpec> lightManager_;
  std::shared_ptr<HybridRenderableManagerSpec> renderableManager_;

  std::shared_ptr<HybridLightSpec> adoptLight(std::shared_ptr<LightCore> light);
};

} // namespace margelo::nitro::filament
