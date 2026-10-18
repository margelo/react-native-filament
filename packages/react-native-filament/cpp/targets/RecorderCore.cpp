#include "RecorderCore.hpp"

#include "FrameInfo.hpp"

#include <backend/PresentCallable.h>
#include <filament/Viewport.h>

#include <algorithm>
#include <chrono>
#include <stdexcept>

namespace margelo::nitro::filament {

RecorderCore::RecorderCore(std::shared_ptr<EngineCore> engine, Format format, ClearSettings clear)
    : ViewHost("Recorder", engine->engine(), clear), engineCore_(std::move(engine)), format_(format),
      rendersIntoPixelBuffers_(engine_.getBackend() == ::filament::backend::Backend::METAL) {
  view_->setViewport({0, 0, format_.width, format_.height});
}

const std::shared_ptr<EngineCore>& RecorderCore::engineCore() const {
  return engineCore_;
}

const RecorderCore::Format& RecorderCore::format() const {
  return format_;
}

void RecorderCore::start(uint32_t frameCount, std::shared_ptr<HybridVideoEncoderSpec> encoder,
                         std::shared_ptr<Promise<std::string>> promise) {
  if (!isLive()) {
    encoder->cancel();
    promise->reject(
        std::make_exception_ptr(std::runtime_error("FilamentDisposedError: Recorder.record() was called on a disposed Recorder.")));
    return;
  }
  if (session_ != nullptr && session_->active) {
    encoder->cancel();
    promise->reject(
        std::make_exception_ptr(std::runtime_error("FilamentBusyError: Recorder.record() was called while another recording is running.")));
    return;
  }
  auto session = std::make_shared<RecordingSession>(RecordingSession{
      .engine = engineCore_,
      .encoder = std::move(encoder),
      .promise = std::move(promise),
      .frameCount = frameCount,
      .presentationBaseNanos =
          std::chrono::duration_cast<std::chrono::nanoseconds>(std::chrono::steady_clock::now().time_since_epoch()).count()});
  session_ = session;
  std::weak_ptr<RecorderCore> recorder = weakSelf();
  std::weak_ptr<RecordingSession> weakSession = session;
  std::weak_ptr<EngineCore> weakEngine = engineCore_;
  session->encoder->setListeners(
      [weakEngine, recorder, weakSession] {
        if (std::shared_ptr<EngineCore> engine = weakEngine.lock()) {
          engine->thread().post({.run = [recorder, weakSession] {
            std::shared_ptr<RecorderCore> owner = recorder.lock();
            std::shared_ptr<RecordingSession> session = weakSession.lock();
            if (owner != nullptr && session != nullptr) {
              owner->acceptFrame(session);
            }
          }});
        }
      },
      [weakEngine, weakSession](const std::exception_ptr& error) {
        if (std::shared_ptr<EngineCore> engine = weakEngine.lock()) {
          engine->thread().post({.run = [weakSession, error] {
            if (std::shared_ptr<RecordingSession> session = weakSession.lock()) {
              session->fail(error);
            }
          }});
        }
      });
  engineCore_->setRecording(true);
  admit(session);
}

void RecorderCore::destroyNative() {
  if (session_ != nullptr) {
    session_->fail(
        std::make_exception_ptr(std::runtime_error("FilamentDisposedError: the Recorder was disposed before the recording finished.")));
    session_ = nullptr;
  }
  destroyViewHost();
}

void RecorderCore::completeFrame(const std::shared_ptr<RecordingSession>& session, uint64_t target, uint32_t index) {
  session->rendering--;
  if (session->active) {
    try {
      session->encoder->submitFrame(target, index);
    } catch (...) {
      session->fail(std::current_exception());
    }
  }
  session->releaseWindowSwapChainWhenIdle();
}

void RecorderCore::admit(const std::shared_ptr<RecordingSession>& session) {
  try {
    uint32_t remaining = session->frameCount - session->admitted;
    uint32_t slots = kMaxUnacceptedFrames - session->unaccepted;
    for (uint32_t count = std::min(remaining, slots); count > 0; count--) {
      renderFrame(session, session->encoder->acquireFrame(), session->admitted++);
    }
  } catch (...) {
    session->fail(std::current_exception());
    return;
  }
  if (session->admitted == session->frameCount && session->unaccepted == 0) {
    finish(session);
  }
}

void RecorderCore::renderFrame(const std::shared_ptr<RecordingSession>& session, uint64_t target, uint32_t index) {
  double fps = format_.fps;
  FrameInfo frame(index * 1e9 / fps, index == 0 ? 0.0 : 1.0 / fps, index / fps, static_cast<double>(index));
  engineCore_->runFrameStages(frame);
  ::filament::SwapChain* swapChain = swapChainFor(session, target, index);
  session->rendering++;
  session->unaccepted++;
  renderer_->setPresentationTime(session->presentationBaseNanos + static_cast<int64_t>(frame.timestampNs));
  renderer_->beginFrame(swapChain);
  renderer_->render(view_);
  renderer_->endFrame();
}

::filament::SwapChain* RecorderCore::swapChainFor(const std::shared_ptr<RecordingSession>& session, uint64_t target, uint32_t index) {
  ::filament::backend::CallbackHandler* handler = &engineCore_->callbacks();
  if (rendersIntoPixelBuffers_) {
    ::filament::SwapChain* swapChain =
        engine_.createSwapChain(reinterpret_cast<void*>(target), ::filament::SwapChain::CONFIG_APPLE_CVPIXELBUFFER);
    swapChain->setFrameCompletedCallback(handler, [session, target, index](::filament::SwapChain* completed) {
      session->engine->thread().post({.run = [session, completed] { session->engine->engine().destroy(completed); }});
      completeFrame(session, target, index);
    });
    return swapChain;
  }
  if (session->windowSwapChain == nullptr) {
    session->windowSwapChain = engine_.createSwapChain(reinterpret_cast<void*>(target));
  }
  session->windowSwapChain->setFrameScheduledCallback(
      handler, [session, target, index](::filament::backend::PresentCallable) { completeFrame(session, target, index); });
  return session->windowSwapChain;
}

void RecorderCore::acceptFrame(const std::shared_ptr<RecordingSession>& session) {
  if (!session->active) {
    return;
  }
  session->unaccepted--;
  admit(session);
}

void RecorderCore::finish(const std::shared_ptr<RecordingSession>& session) {
  session->active = false;
  engineCore_->setRecording(false);
  engine_.flushAndWait();
  session->releaseWindowSwapChainWhenIdle();
  std::shared_ptr<Promise<std::string>> promise = session->promise;
  std::shared_ptr<Promise<std::string>> finished = session->encoder->finish();
  finished->addOnResolvedListener([promise](const std::string& uri) { promise->resolve(uri); });
  finished->addOnRejectedListener([promise](const std::exception_ptr& error) { promise->reject(error); });
}

std::weak_ptr<RecorderCore> RecorderCore::weakSelf() {
  return std::static_pointer_cast<RecorderCore>(shared_from_this());
}

} // namespace margelo::nitro::filament
