#pragma once

#include <filament/Engine.h>
#include <filament/Texture.h>
#include <gltfio/TextureProvider.h>

#include <cstdint>
#include <exception>
#include <functional>
#include <memory>
#include <unordered_map>

namespace margelo::nitro::filament {

class TextureDecoder final {
public:
  using Completion = std::function<void(::filament::Texture* texture, std::exception_ptr error)>;

  explicit TextureDecoder(::filament::Engine& engine);
  ~TextureDecoder();
  TextureDecoder(const TextureDecoder&) = delete;
  TextureDecoder& operator=(const TextureDecoder&) = delete;

  void push(const uint8_t* bytes, size_t size, bool srgb, Completion completion);
  void update();
  void cancelAll();
  bool empty() const;

private:
  ::filament::gltfio::TextureProvider& providerFor(const uint8_t* bytes, size_t size, const char*& mimeType);
  void popFinished(::filament::gltfio::TextureProvider& provider);

  ::filament::Engine& engine_;
  std::unique_ptr<::filament::gltfio::TextureProvider> stb_;
  std::unique_ptr<::filament::gltfio::TextureProvider> ktx2_;
  std::unordered_map<::filament::Texture*, Completion> pending_;
};

} // namespace margelo::nitro::filament
