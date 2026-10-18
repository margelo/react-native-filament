#include "IndirectLightCore.hpp"

#include "utils/TextureMemory.hpp"

#include "SceneCore.hpp"

#include "Ktx1Cubemap.hpp"

#include <ktxreader/Ktx1Reader.h>

#include <memory>
#include <stdexcept>

namespace margelo::nitro::filament {

IndirectLightCore::IndirectLightCore(std::shared_ptr<EngineCore> engine, const uint8_t* ktx, size_t size, float intensity)
    : Resource("IndirectLight"), engine_(std::move(engine)) {
  std::unique_ptr<image::Ktx1Bundle> bundle = parseKtx1Cubemap(ktx, size, "indirect light");
  ::filament::math::float3 harmonics[9];
  if (!bundle->getSphericalHarmonics(harmonics)) {
    throw std::invalid_argument(
        "FilamentAssetError: The indirect light cubemap has no spherical harmonics. Generate it with cmgen --sh=3.");
  }
  ::filament::Engine& filament = engine_->engine();
  reflections_ = ktxreader::Ktx1Reader::createTexture(&filament, bundle.release(), false);
  byteSize_ = estimateTextureBytes(*reflections_);
  indirectLight_ =
      ::filament::IndirectLight::Builder().reflections(reflections_).irradiance(3, harmonics).intensity(intensity).build(filament);
}

IndirectLightCore::~IndirectLightCore() {
  if (!isDestroyed()) {
    engine_->thread().post({.run = [engine = engine_, light = indirectLight_, reflections = reflections_] {
      engine->engine().destroy(light);
      engine->engine().destroy(reflections);
    }});
  }
}

::filament::IndirectLight* IndirectLightCore::indirectLight() const {
  return indirectLight_;
}

Users<SceneCore>& IndirectLightCore::users() {
  return users_;
}

void IndirectLightCore::destroyNative() {
  users_.forEach([](const std::shared_ptr<SceneCore>& scene) { scene->setIndirectLight(nullptr); });
  engine_->engine().destroy(indirectLight_);
  engine_->engine().destroy(reflections_);
}

size_t IndirectLightCore::byteSize() const {
  return byteSize_;
}

} // namespace margelo::nitro::filament
