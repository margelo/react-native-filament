#include "HybridCameraManipulator.hpp"

namespace margelo::nitro::filament {

HybridCameraManipulator::HybridCameraManipulator(std::shared_ptr<EngineCore> engine, std::shared_ptr<ManipulatorCore> core)
    : HybridObject(TAG), engine_(std::move(engine)), core_(std::move(core)) {}

HybridCameraManipulator::~HybridCameraManipulator() {
  core_->stop();
}

void HybridCameraManipulator::grabBegin(double x, double y, bool strafe) {
  send([&](ManipulatorCommandQueue& commands) { commands.grabBegin(static_cast<float>(x), static_cast<float>(y), strafe); });
}

void HybridCameraManipulator::grabUpdate(double x, double y) {
  send([&](ManipulatorCommandQueue& commands) { commands.grabUpdate(static_cast<float>(x), static_cast<float>(y)); });
}

void HybridCameraManipulator::grabEnd() {
  send([](ManipulatorCommandQueue& commands) { commands.grabEnd(); });
}

void HybridCameraManipulator::scroll(double x, double y, double delta) {
  send(
      [&](ManipulatorCommandQueue& commands) { commands.scroll(static_cast<float>(x), static_cast<float>(y), static_cast<float>(delta)); });
}

void HybridCameraManipulator::jumpToHome() {
  send([](ManipulatorCommandQueue& commands) { commands.jumpToHome(); });
}

void HybridCameraManipulator::setViewport(double width, double height) {
  core_->setViewport(width, height);
  engine_->requestFrame();
}

LookAt HybridCameraManipulator::getLookAt() {
  return core_->lookAt();
}

void HybridCameraManipulator::dispose() {
  core_->stop();
}

const std::shared_ptr<EngineCore>& HybridCameraManipulator::engineCore() const {
  return engine_;
}

const std::shared_ptr<ManipulatorCore>& HybridCameraManipulator::core() const {
  return core_;
}

template <typename Enqueue> void HybridCameraManipulator::send(Enqueue&& enqueue) {
  if (core_->isStopped()) {
    return;
  }
  enqueue(core_->commands());
  engine_->requestFrame();
}

} // namespace margelo::nitro::filament
