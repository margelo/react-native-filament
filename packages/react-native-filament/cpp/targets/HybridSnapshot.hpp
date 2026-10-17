#pragma once

#include "HybridSnapshotSpec.hpp"
#include "SnapshotCore.hpp"

#include <memory>

namespace margelo::nitro::filament {

class HybridSnapshot final : public HybridSnapshotSpec {
public:
  explicit HybridSnapshot(std::shared_ptr<const SnapshotCore> core);

  double getWidth() override;
  double getHeight() override;
  std::shared_ptr<ArrayBuffer> toArrayBuffer() override;
  std::shared_ptr<Promise<std::string>> saveToTemporaryFile() override;
  size_t getExternalMemorySize() noexcept override;

private:
  std::shared_ptr<const SnapshotCore> core_;
};

} // namespace margelo::nitro::filament
