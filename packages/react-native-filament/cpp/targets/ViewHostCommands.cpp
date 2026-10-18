#include "ViewHostCommands.hpp"

#include "scene/HybridCamera.hpp"
#include "scene/HybridScene.hpp"
#include "utils/EngineChecks.hpp"

namespace margelo::nitro::filament {

ViewHost::ClearSettings toClearSettings(const std::optional<ClearOptions>& options) {
  ClearOptions resolved = options.value_or(ClearOptions());
  auto [r, g, b, a] = resolved.color.value_or(std::make_tuple(0.0, 0.0, 0.0, 0.0));
  return {.color = {static_cast<float>(r), static_cast<float>(g), static_cast<float>(b), static_cast<float>(a)},
          .clear = resolved.clear.value_or(true),
          .discard = resolved.discard.value_or(true)};
}

void setHostScene(ViewHost& host, const EngineCore& engine, const std::shared_ptr<HybridSceneSpec>& scene, const char* method) {
  host.requireLive(method);
  auto resolved = requireSameEngine<HybridScene>(scene, engine, method);
  resolved->core()->requireLive(method);
  host.setScene(resolved->core());
}

void setHostCamera(ViewHost& host, const EngineCore& engine, const std::shared_ptr<HybridCameraSpec>& camera, const char* method) {
  host.requireLive(method);
  auto resolved = requireSameEngine<HybridCamera>(camera, engine, method);
  resolved->core()->requireLive(method);
  host.setCamera(resolved->core());
}

} // namespace margelo::nitro::filament
