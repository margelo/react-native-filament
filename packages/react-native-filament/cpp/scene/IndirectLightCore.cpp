#include "IndirectLightCore.hpp"

#include "SceneCore.hpp"

#include <image/Ktx1Bundle.h>
#include <ktxreader/Ktx1Reader.h>

#include <algorithm>
#include <array>
#include <memory>
#include <stdexcept>

namespace margelo::nitro::filament {

namespace {

  constexpr std::array<uint8_t, 12> kKtx1Identifier = {0xAB, 'K', 'T', 'X', ' ', '1', '1', 0xBB, '\r', '\n', 0x1A, '\n'};
  constexpr size_t kKtx1HeaderSize = 64;

  std::unique_ptr<image::Ktx1Bundle> parseCubemap(const uint8_t* ktx, size_t size) {
    if (size < kKtx1HeaderSize || size > UINT32_MAX || !std::equal(kKtx1Identifier.begin(), kKtx1Identifier.end(), ktx)) {
      throw std::invalid_argument("FilamentAssetError: The indirect light source is not a KTX1 file.");
    }
    auto bundle = std::make_unique<image::Ktx1Bundle>(ktx, static_cast<uint32_t>(size));
    if (!bundle->isCubemap()) {
      throw std::invalid_argument("FilamentAssetError: The indirect light source is not a cubemap.");
    }
    return bundle;
  }

} // namespace

IndirectLightCore::IndirectLightCore(std::shared_ptr<EngineCore> engine, const uint8_t* ktx, size_t size, float intensity)
    : Resource("IndirectLight"), engine_(std::move(engine)) {
  std::unique_ptr<image::Ktx1Bundle> bundle = parseCubemap(ktx, size);
  ::filament::math::float3 harmonics[9];
  if (!bundle->getSphericalHarmonics(harmonics)) {
    throw std::invalid_argument(
        "FilamentAssetError: The indirect light cubemap has no spherical harmonics. Generate it with cmgen --sh=3.");
  }
  ::filament::Engine& filament = engine_->engine();
  reflections_ = ktxreader::Ktx1Reader::createTexture(&filament, bundle.release(), false);
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

} // namespace margelo::nitro::filament
