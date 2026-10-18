#include "TextureDecoder.hpp"

#include <algorithm>
#include <array>
#include <stdexcept>
#include <string>

namespace margelo::nitro::filament {

namespace {

  constexpr std::array<uint8_t, 12> kKtx2Identifier = {0xAB, 'K', 'T', 'X', ' ', '2', '0', 0xBB, '\r', '\n', 0x1A, '\n'};
  constexpr std::array<uint8_t, 8> kPngSignature = {0x89, 'P', 'N', 'G', '\r', '\n', 0x1A, '\n'};

  bool startsWith(const uint8_t* bytes, size_t size, const uint8_t* prefix, size_t prefixSize) {
    return size >= prefixSize && std::equal(prefix, prefix + prefixSize, bytes);
  }

  std::exception_ptr failure(const std::string& message) {
    return std::make_exception_ptr(std::invalid_argument("FilamentAssetError: " + message));
  }

} // namespace

TextureDecoder::TextureDecoder(::filament::Engine& engine)
    : engine_(engine), stb_(::filament::gltfio::createStbProvider(&engine)), ktx2_(::filament::gltfio::createKtx2Provider(&engine)) {}

TextureDecoder::~TextureDecoder() {
  cancelAll();
}

void TextureDecoder::push(const uint8_t* bytes, size_t size, bool srgb, Completion completion) {
  const char* mimeType = nullptr;
  ::filament::gltfio::TextureProvider* provider = nullptr;
  try {
    provider = &providerFor(bytes, size, mimeType);
  } catch (...) {
    completion(nullptr, std::current_exception());
    return;
  }
  auto flags = srgb ? ::filament::gltfio::TextureProvider::TextureFlags::sRGB : ::filament::gltfio::TextureProvider::TextureFlags::NONE;
  ::filament::Texture* texture = provider->pushTexture(bytes, size, mimeType, flags);
  if (texture == nullptr) {
    const char* message = provider->getPushMessage();
    completion(nullptr, failure(std::string("The image could not be decoded: ") + (message == nullptr ? "unknown error" : message)));
    return;
  }
  pending_.emplace(texture, std::move(completion));
}

void TextureDecoder::update() {
  for (::filament::gltfio::TextureProvider* provider : {stb_.get(), ktx2_.get()}) {
    provider->updateQueue();
    popFinished(*provider);
  }
}

void TextureDecoder::cancelAll() {
  for (::filament::gltfio::TextureProvider* provider : {stb_.get(), ktx2_.get()}) {
    provider->cancelDecoding();
    provider->updateQueue();
    while (::filament::Texture* texture = provider->popTexture()) {
      engine_.destroy(texture);
    }
  }
  std::unordered_map<::filament::Texture*, Completion> cancelled;
  cancelled.swap(pending_);
  for (auto& [texture, completion] : cancelled) {
    completion(nullptr, std::make_exception_ptr(std::runtime_error("The Engine was shut down while the texture was loading.")));
  }
}

bool TextureDecoder::empty() const {
  return pending_.empty();
}

::filament::gltfio::TextureProvider& TextureDecoder::providerFor(const uint8_t* bytes, size_t size, const char*& mimeType) {
  if (startsWith(bytes, size, kPngSignature.data(), kPngSignature.size())) {
    mimeType = "image/png";
    return *stb_;
  }
  if (size >= 3 && bytes[0] == 0xFF && bytes[1] == 0xD8 && bytes[2] == 0xFF) {
    mimeType = "image/jpeg";
    return *stb_;
  }
  if (startsWith(bytes, size, kKtx2Identifier.data(), kKtx2Identifier.size())) {
    mimeType = "image/ktx2";
    return *ktx2_;
  }
  throw std::invalid_argument("FilamentAssetError: Textures must be PNG, JPEG or KTX2.");
}

void TextureDecoder::popFinished(::filament::gltfio::TextureProvider& provider) {
  while (::filament::Texture* texture = provider.popTexture()) {
    const char* message = provider.getPopMessage();
    auto found = pending_.find(texture);
    if (found == pending_.end()) {
      engine_.destroy(texture);
      continue;
    }
    Completion completion = std::move(found->second);
    pending_.erase(found);
    if (message != nullptr) {
      engine_.destroy(texture);
      completion(nullptr, failure(std::string("The image could not be decoded: ") + message));
    } else {
      completion(texture, nullptr);
    }
  }
}

} // namespace margelo::nitro::filament
