#pragma once

#include "ManipulatorCommand.hpp"

#include <cstddef>
#include <cstdint>
#include <mutex>
#include <optional>
#include <vector>

namespace margelo::nitro::filament {

class ManipulatorCommandQueue final {
public:
  static constexpr size_t kCapacity = 256;

  ManipulatorCommandQueue();

  void grabBegin(float x, float y, bool strafe);
  void grabUpdate(float x, float y);
  void grabEnd();
  void scroll(float x, float y, float delta);
  void jumpToHome();

  const std::vector<ManipulatorCommand>& swap();
  void recycle();

private:
  bool admits(size_t extra) const;
  void requireRoom(size_t extra, const char* method) const;

  std::mutex mutex_;
  std::vector<ManipulatorCommand> front_;
  std::vector<ManipulatorCommand> back_;
  std::optional<uint64_t> activeSession_;
  uint64_t nextSession_ = 1;
  size_t reservedEnd_ = 0;
};

} // namespace margelo::nitro::filament
