#include "HybridView.hpp"

#include "ShadowTypeConversion.hpp"
#include "ViewOptionsConversion.hpp"
#include "utils/MatrixConversion.hpp"
#include "utils/ThreadChecks.hpp"

namespace margelo::nitro::filament {

HybridView::HybridView(std::shared_ptr<EngineCore> engine, std::shared_ptr<ViewHost> target)
    : HybridObject(TAG), engine_(std::move(engine)), target_(std::move(target)) {}

AntiAliasing HybridView::getAntiAliasing() {
  return usableView("View.antiAliasing").getAntiAliasing() == ::filament::AntiAliasing::FXAA ? AntiAliasing::FXAA : AntiAliasing::NONE;
}

void HybridView::setAntiAliasing(AntiAliasing antiAliasing) {
  usableView("View.antiAliasing")
      .setAntiAliasing(antiAliasing == AntiAliasing::FXAA ? ::filament::AntiAliasing::FXAA : ::filament::AntiAliasing::NONE);
}

Dithering HybridView::getDithering() {
  return usableView("View.dithering").getDithering() == ::filament::Dithering::TEMPORAL ? Dithering::TEMPORAL : Dithering::NONE;
}

void HybridView::setDithering(Dithering dithering) {
  usableView("View.dithering")
      .setDithering(dithering == Dithering::TEMPORAL ? ::filament::Dithering::TEMPORAL : ::filament::Dithering::NONE);
}

bool HybridView::getPostProcessing() {
  return usableView("View.postProcessing").isPostProcessingEnabled();
}

void HybridView::setPostProcessing(bool postProcessing) {
  usableView("View.postProcessing").setPostProcessingEnabled(postProcessing);
}

bool HybridView::getShadowing() {
  return usableView("View.shadowing").isShadowingEnabled();
}

void HybridView::setShadowing(bool shadowing) {
  usableView("View.shadowing").setShadowingEnabled(shadowing);
}

ShadowType HybridView::getShadowType() {
  return fromFilamentShadowType(usableView("View.shadowType").getShadowType());
}

void HybridView::setShadowType(ShadowType shadowType) {
  usableView("View.shadowType").setShadowType(toFilamentShadowType(shadowType));
}

bool HybridView::getScreenSpaceRefraction() {
  return usableView("View.screenSpaceRefraction").isScreenSpaceRefractionEnabled();
}

void HybridView::setScreenSpaceRefraction(bool screenSpaceRefraction) {
  usableView("View.screenSpaceRefraction").setScreenSpaceRefractionEnabled(screenSpaceRefraction);
}

void HybridView::setAmbientOcclusionOptions(const AmbientOcclusionOptions& options) {
  usableView("View.setAmbientOcclusionOptions()").setAmbientOcclusionOptions(toFilamentOptions(options));
}

void HybridView::setBloomOptions(const BloomOptions& options) {
  usableView("View.setBloomOptions()").setBloomOptions(toFilamentOptions(options));
}

void HybridView::setTemporalAntiAliasingOptions(const TemporalAntiAliasingOptions& options) {
  usableView("View.setTemporalAntiAliasingOptions()").setTemporalAntiAliasingOptions(toFilamentOptions(options));
}

void HybridView::setDynamicResolutionOptions(const DynamicResolutionOptions& options) {
  usableView("View.setDynamicResolutionOptions()").setDynamicResolutionOptions(toFilamentOptions(options));
}

std::tuple<double, double> HybridView::projectWorldToScreen(const std::tuple<double, double, double>& position) {
  usableView("View.projectWorldToScreen()");
  ::filament::math::float2 point = target_->projectWorldToPoints(toFloat3(position));
  return {point.x, point.y};
}

::filament::View& HybridView::usableView(const char* method) {
  requireRenderThread(engine_->thread(), method);
  target_->requireLive(method);
  return target_->view();
}

} // namespace margelo::nitro::filament
