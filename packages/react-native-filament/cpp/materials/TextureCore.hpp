#pragma once

#include "engine/EngineCore.hpp"
#include "resources/Resource.hpp"

#include <filament/Texture.h>

#include <memory>

namespace margelo::nitro::filament {

class TextureCore final : public Resource {
public:
  TextureCore(std::shared_ptr<EngineCore> engine, ::filament::Texture* texture);
  ~TextureCore() override;

  ::filament::Texture& texture();
  double width() const;
  double height() const;
  size_t byteSize() const;

protected:
  void destroyNative() override;

private:
  std::shared_ptr<EngineCore> engine_;
  ::filament::Texture* texture_;
  const double width_;
  const double height_;
  const size_t byteSize_;
};

} // namespace margelo::nitro::filament
