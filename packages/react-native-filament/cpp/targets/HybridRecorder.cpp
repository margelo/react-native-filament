#include "HybridRecorder.hpp"

#include "HybridVideoEncoderFactorySpec.hpp"
#include "ViewHostCommands.hpp"
#include "engine/HybridEngine.hpp"
#include "scene/HybridView.hpp"
#include "utils/TemporaryFiles.hpp"
#include "utils/ThreadChecks.hpp"

#include <NitroModules/HybridObjectRegistry.hpp>

#include <cmath>
#include <stdexcept>
#include <string>

namespace margelo::nitro::filament {

namespace {

  std::shared_ptr<HybridVideoEncoderFactorySpec> createEncoderFactory() {
    auto factory =
        std::dynamic_pointer_cast<HybridVideoEncoderFactorySpec>(HybridObjectRegistry::createHybridObject("VideoEncoderFactory"));
    if (factory == nullptr) {
      throw std::runtime_error("The VideoEncoderFactory HybridObject is not registered.");
    }
    return factory;
  }

} // namespace

HybridRecorder::HybridRecorder(std::shared_ptr<HybridEngine> engine, std::shared_ptr<RecorderCore> core)
    : HybridObject(TAG), engine_(std::move(engine)), core_(std::move(core)), view_(std::make_shared<HybridView>(engine_->core(), core_)) {}

HybridRecorder::~HybridRecorder() {
  dispose();
}

double HybridRecorder::getWidth() {
  return core_->format().width;
}

double HybridRecorder::getHeight() {
  return core_->format().height;
}

double HybridRecorder::getFps() {
  return core_->format().fps;
}

std::shared_ptr<HybridViewSpec> HybridRecorder::getView() {
  return view_;
}

void HybridRecorder::setScene(const std::shared_ptr<HybridSceneSpec>& scene) {
  requireRenderThread(engine_->core()->thread(), "Recorder.setScene()");
  setHostScene(*core_, *engine_->core(), scene, "Recorder.setScene()");
}

void HybridRecorder::setCamera(const std::shared_ptr<HybridCameraSpec>& camera) {
  requireRenderThread(engine_->core()->thread(), "Recorder.setCamera()");
  setHostCamera(*core_, *engine_->core(), camera, "Recorder.setCamera()");
}

void HybridRecorder::setClearOptions(const ClearOptions& options) {
  requireRenderThread(engine_->core()->thread(), "Recorder.setClearOptions()");
  core_->requireLive("Recorder.setClearOptions()");
  core_->setClearOptions(toClearSettings(options));
}

std::shared_ptr<Promise<std::string>> HybridRecorder::record(double frameCount) {
  core_->requireLive("Recorder.record()");
  if (!(frameCount >= 1) || std::floor(frameCount) != frameCount) {
    throw std::invalid_argument("Recorder.record() needs a positive whole number of frames, got " + std::to_string(frameCount) + ".");
  }
  auto promise = Promise<std::string>::create();
  if (recording_->exchange(true)) {
    promise->reject(
        std::make_exception_ptr(std::runtime_error("FilamentBusyError: Recorder.record() was called while another recording is running.")));
    return promise;
  }
  promise->addOnResolvedListener([recording = recording_](const std::string&) { *recording = false; });
  promise->addOnRejectedListener([recording = recording_](const std::exception_ptr&) { *recording = false; });
  try {
    startEncoder(static_cast<uint32_t>(frameCount), promise);
  } catch (...) {
    promise->reject(std::current_exception());
  }
  return promise;
}

void HybridRecorder::startEncoder(uint32_t frameCount, const std::shared_ptr<Promise<std::string>>& promise) {
  const RecorderCore::Format& format = core_->format();
  VideoEncoderOptions options(format.width, format.height, format.fps, format.bitRate, newTemporaryFilePath("rnf-recording", "mp4"));
  std::shared_ptr<Promise<std::shared_ptr<HybridVideoEncoderSpec>>> encoder = createEncoderFactory()->createEncoder(options);
  encoder->addOnResolvedListener(
      [engine = engine_->core(), core = core_, frameCount, promise](const std::shared_ptr<HybridVideoEncoderSpec>& created) {
        engine->thread().post({
            .run = [core, created, frameCount, promise] { core->start(frameCount, created, promise); },
            .cancel =
                [created, promise] {
                  created->cancel();
                  promise->reject(std::make_exception_ptr(std::runtime_error("FilamentDisposedError: the Engine was shut down.")));
                },
        });
      });
  encoder->addOnRejectedListener([promise](const std::exception_ptr& error) { promise->reject(error); });
}

void HybridRecorder::dispose() {
  if (disposed_.exchange(true)) {
    return;
  }
  engine_->core()->dispose(core_);
}

size_t HybridRecorder::getExternalMemorySize() noexcept {
  const RecorderCore::Format& format = core_->format();
  return core_->isLive() ? static_cast<size_t>(format.width) * format.height * 4 * 2 : 0;
}

} // namespace margelo::nitro::filament
