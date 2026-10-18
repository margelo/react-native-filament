#include "HybridSnapshot.hpp"

#include "threading/WorkerPool.hpp"
#include "utils/PngEncoder.hpp"
#include "utils/TemporaryFiles.hpp"

#include <fstream>
#include <stdexcept>
#include <string>

namespace margelo::nitro::filament {

HybridSnapshot::HybridSnapshot(std::shared_ptr<const SnapshotCore> core) : HybridObject(TAG), core_(std::move(core)) {}

double HybridSnapshot::getWidth() {
  return core_->width;
}

double HybridSnapshot::getHeight() {
  return core_->height;
}

std::shared_ptr<ArrayBuffer> HybridSnapshot::toArrayBuffer() {
  return ArrayBuffer::copy(core_->rgba);
}

std::shared_ptr<Promise<std::string>> HybridSnapshot::saveToTemporaryFile() {
  std::string path = newTemporaryFilePath("rnf-snapshot", "png");
  auto promise = Promise<std::string>::create();
  WorkerPool::shared().post([core = core_, path, promise] {
    try {
      std::vector<uint8_t> png = encodePng(core->rgba.data(), core->width, core->height);
      std::ofstream file(path, std::ios::binary | std::ios::trunc);
      file.write(reinterpret_cast<const char*>(png.data()), static_cast<std::streamsize>(png.size()));
      if (!file) {
        throw std::runtime_error("Snapshot.saveToTemporaryFile() could not write " + path + ".");
      }
      promise->resolve("file://" + path);
    } catch (...) {
      promise->reject(std::current_exception());
    }
  });
  return promise;
}

size_t HybridSnapshot::getExternalMemorySize() noexcept {
  return core_->rgba.size();
}

} // namespace margelo::nitro::filament
