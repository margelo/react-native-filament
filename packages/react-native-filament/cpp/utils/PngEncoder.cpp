#include "PngEncoder.hpp"

#include <zlib.h>

#include <array>
#include <cstring>
#include <stdexcept>

namespace margelo::nitro::filament {

namespace {

  constexpr std::array<uint8_t, 8> kSignature = {0x89, 'P', 'N', 'G', '\r', '\n', 0x1A, '\n'};

  void appendUInt32(std::vector<uint8_t>& out, uint32_t value) {
    out.push_back(static_cast<uint8_t>(value >> 24));
    out.push_back(static_cast<uint8_t>(value >> 16));
    out.push_back(static_cast<uint8_t>(value >> 8));
    out.push_back(static_cast<uint8_t>(value));
  }

  void appendChunk(std::vector<uint8_t>& out, const char type[4], const std::vector<uint8_t>& data) {
    appendUInt32(out, static_cast<uint32_t>(data.size()));
    size_t typeStart = out.size();
    out.insert(out.end(), type, type + 4);
    out.insert(out.end(), data.begin(), data.end());
    uLong crc = crc32(0, out.data() + typeStart, static_cast<uInt>(out.size() - typeStart));
    appendUInt32(out, static_cast<uint32_t>(crc));
  }

} // namespace

std::vector<uint8_t> encodePng(const uint8_t* rgba, uint32_t width, uint32_t height) {
  size_t stride = static_cast<size_t>(width) * 4;
  std::vector<uint8_t> scanlines((stride + 1) * height);
  for (uint32_t row = 0; row < height; row++) {
    scanlines[row * (stride + 1)] = 0;
    std::memcpy(&scanlines[row * (stride + 1) + 1], rgba + row * stride, stride);
  }
  uLongf compressedSize = compressBound(static_cast<uLong>(scanlines.size()));
  std::vector<uint8_t> compressed(compressedSize);
  if (compress2(compressed.data(), &compressedSize, scanlines.data(), static_cast<uLong>(scanlines.size()), Z_BEST_SPEED) != Z_OK) {
    throw std::runtime_error("The snapshot could not be compressed.");
  }
  compressed.resize(compressedSize);

  std::vector<uint8_t> header;
  appendUInt32(header, width);
  appendUInt32(header, height);
  header.insert(header.end(), {8, 6, 0, 0, 0});

  std::vector<uint8_t> png(kSignature.begin(), kSignature.end());
  appendChunk(png, "IHDR", header);
  appendChunk(png, "IDAT", compressed);
  appendChunk(png, "IEND", {});
  return png;
}

} // namespace margelo::nitro::filament
