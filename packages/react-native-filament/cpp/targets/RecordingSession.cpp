#include "RecordingSession.hpp"

namespace margelo::nitro::filament {

void RecordingSession::fail(const std::exception_ptr& error) {
  if (!active) {
    return;
  }
  active = false;
  releaseWindowSwapChainWhenIdle();
  encoder->cancel();
  promise->reject(error);
  engine->setRecording(false);
}

void RecordingSession::releaseWindowSwapChainWhenIdle() {
  if (active || rendering > 0 || windowSwapChain == nullptr) {
    return;
  }
  engine->engine().destroy(windowSwapChain);
  windowSwapChain = nullptr;
}

} // namespace margelo::nitro::filament
