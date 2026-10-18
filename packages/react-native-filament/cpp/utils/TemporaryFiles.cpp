#include "TemporaryFiles.hpp"

#include "assets/AssetBytes.hpp"

#include <atomic>
#include <chrono>
#include <cstdint>

namespace margelo::nitro::filament {

std::string newTemporaryFilePath(const std::string& prefix, const std::string& extension) {
  static std::atomic<uint64_t> nextFile{0};
  std::string directory = temporaryDirectory();
  if (!directory.empty() && directory.back() == '/') {
    directory.pop_back();
  }
  return directory + "/" + prefix + "-" + std::to_string(std::chrono::system_clock::now().time_since_epoch().count()) + "-" +
         std::to_string(nextFile++) + "." + extension;
}

} // namespace margelo::nitro::filament
