//
// Created by Hanno Gödecke on 24.04.24.
//

#include "RendererWrapper.h"

namespace margelo {
void RendererWrapper::loadHybridMethods() {
  registerHybridMethod("setFrameRateOptions", &RendererWrapper::setFrameRateOptions, this);
  registerHybridMethod("setClearContent", &RendererWrapper::setClearContent, this);
  registerHybridMethod("setPresentationTime", &RendererWrapper::setPresentationTime, this);
  registerHybridMethod("beginFrame", &RendererWrapper::beginFrame, this);
  registerHybridMethod("render", &RendererWrapper::render, this);
  registerHybridMethod("endFrame", &RendererWrapper::endFrame, this);
}

void RendererWrapper::setFrameRateOptions(std::unordered_map<std::string, double> options) {
  Renderer::FrameRateOptions frameRateOptions;
  if (options.find("interval") != options.end()) {
    frameRateOptions.interval = static_cast<uint8_t>(options["interval"]);
  }
  if (options.find("history") != options.end()) {
    frameRateOptions.history = static_cast<uint8_t>(options["history"]);
  }
  if (options.find("scaleRate") != options.end()) {
    frameRateOptions.scaleRate = static_cast<float>(options["scaleRate"]);
  }
  if (options.find("headRoomRatio") != options.end()) {
    frameRateOptions.headRoomRatio = static_cast<float>(options["headRoomRatio"]);
  }
  pointee()->setFrameRateOptions(frameRateOptions);
}

void RendererWrapper::setClearContent(bool shouldClear) {
  pointee()->setClearOptions({.clear = shouldClear});
}

void RendererWrapper::setPresentationTime(double timestamp) {
  int64_t timestampNs = static_cast<int64_t>(timestamp * 1'000) * 1'000;
  pointee()->setPresentationTime(timestampNs);
}

bool RendererWrapper::beginFrame(std::shared_ptr<SwapChainWrapper> swapChainWrapper, double timestamp) {
  std::shared_ptr<SwapChain> swapChain = swapChainWrapper->getSwapChain();
  return pointee()->beginFrame(swapChain.get(), timestamp);
}

void RendererWrapper::render(std::shared_ptr<ViewWrapper> viewWrapper) {
  std::shared_ptr<View> view = viewWrapper->getView();
  pointee()->render(view.get());
}

void RendererWrapper::endFrame() {
  pointee()->endFrame();
}
} // namespace margelo
