#include "HybridTexture.hpp"

namespace margelo::nitro::filament {

HybridTexture::HybridTexture(std::shared_ptr<EngineCore> engine, std::shared_ptr<TextureCore> core)
    : HybridObject(TAG), engine_(std::move(engine)), core_(std::move(core)) {}

double HybridTexture::getWidth() {
  return core_->width();
}

double HybridTexture::getHeight() {
  return core_->height();
}

void HybridTexture::dispose() {
  engine_->dispose(core_);
}

const std::shared_ptr<EngineCore>& HybridTexture::engineCore() const {
  return engine_;
}

const std::shared_ptr<TextureCore>& HybridTexture::core() const {
  return core_;
}

} // namespace margelo::nitro::filament
