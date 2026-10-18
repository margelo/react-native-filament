#pragma once

#include "HybridTextureSpec.hpp"
#include "TextureCore.hpp"

#include <memory>

namespace margelo::nitro::filament {

class HybridTexture final : public HybridTextureSpec {
public:
  HybridTexture(std::shared_ptr<EngineCore> engine, std::shared_ptr<TextureCore> core);

  double getWidth() override;
  double getHeight() override;
  void dispose() override;
  size_t getExternalMemorySize() noexcept override;

  const std::shared_ptr<EngineCore>& engineCore() const;
  const std::shared_ptr<TextureCore>& core() const;

private:
  std::shared_ptr<EngineCore> engine_;
  std::shared_ptr<TextureCore> core_;
};

} // namespace margelo::nitro::filament
