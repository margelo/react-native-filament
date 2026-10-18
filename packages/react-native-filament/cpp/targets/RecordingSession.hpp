#pragma once

#include "HybridVideoEncoderSpec.hpp"
#include "engine/EngineCore.hpp"

#include <NitroModules/Promise.hpp>
#include <filament/SwapChain.h>

#include <cstdint>
#include <memory>
#include <string>

namespace margelo::nitro::filament {

struct RecordingSession {
  std::shared_ptr<EngineCore> engine;
  std::shared_ptr<HybridVideoEncoderSpec> encoder;
  std::shared_ptr<Promise<std::string>> promise;
  uint32_t frameCount;
  int64_t presentationBaseNanos;
  uint32_t admitted = 0;
  uint32_t unaccepted = 0;
  bool active = true;
  ::filament::SwapChain* windowSwapChain = nullptr;
};

} // namespace margelo::nitro::filament
