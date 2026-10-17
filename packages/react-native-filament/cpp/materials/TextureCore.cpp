#include "TextureCore.hpp"

namespace margelo::nitro::filament {

TextureCore::TextureCore(std::shared_ptr<EngineCore> engine, ::filament::Texture* texture)
    : Resource("Texture"), engine_(std::move(engine)), texture_(texture), width_(texture->getWidth()), height_(texture->getHeight()) {}

TextureCore::~TextureCore() {
  if (!isDestroyed()) {
    engine_->thread().post({.run = [engine = engine_, texture = texture_] {
      engine->materialAssignments().releaseTexture(texture);
      engine->engine().destroy(texture);
    }});
  }
}

::filament::Texture& TextureCore::texture() {
  return *texture_;
}

double TextureCore::width() const {
  return width_;
}

double TextureCore::height() const {
  return height_;
}

void TextureCore::destroyNative() {
  engine_->materialAssignments().releaseTexture(texture_);
  engine_->engine().destroy(texture_);
}

} // namespace margelo::nitro::filament
