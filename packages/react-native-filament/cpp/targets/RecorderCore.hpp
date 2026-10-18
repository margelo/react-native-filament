#pragma once

#include "HybridVideoEncoderSpec.hpp"
#include "RecordingSession.hpp"
#include "ViewHost.hpp"
#include "engine/EngineCore.hpp"

#include <NitroModules/Promise.hpp>
#include <filament/SwapChain.h>

#include <cstdint>
#include <memory>
#include <string>

namespace margelo::nitro::filament {

class RecorderCore final : public ViewHost {
public:
  struct Format {
    uint32_t width;
    uint32_t height;
    double fps;
    double bitRate;
  };

  RecorderCore(std::shared_ptr<EngineCore> engine, Format format, ClearSettings clear);

  const std::shared_ptr<EngineCore>& engineCore() const;
  const Format& format() const;
  void start(uint32_t frameCount, std::shared_ptr<HybridVideoEncoderSpec> encoder, std::shared_ptr<Promise<std::string>> promise);

protected:
  void destroyNative() override;

private:
  static constexpr uint32_t kMaxUnacceptedFrames = 2;

  static void completeFrame(const std::shared_ptr<RecordingSession>& session, uint64_t target, uint32_t index);
  void admit(const std::shared_ptr<RecordingSession>& session);
  void renderFrame(const std::shared_ptr<RecordingSession>& session, uint64_t target, uint32_t index);
  ::filament::SwapChain* swapChainFor(const std::shared_ptr<RecordingSession>& session, uint64_t target, uint32_t index);
  void acceptFrame(const std::shared_ptr<RecordingSession>& session);
  void finish(const std::shared_ptr<RecordingSession>& session);
  std::weak_ptr<RecorderCore> weakSelf();

  std::shared_ptr<EngineCore> engineCore_;
  const Format format_;
  const bool rendersIntoPixelBuffers_;
  std::shared_ptr<RecordingSession> session_;
};

} // namespace margelo::nitro::filament
