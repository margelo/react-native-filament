#pragma once

#include "HybridCameraManipulatorSpec.hpp"
#include "ManipulatorCore.hpp"
#include "engine/EngineCore.hpp"

#include <memory>

namespace margelo::nitro::filament {

class HybridCameraManipulator final : public HybridCameraManipulatorSpec {
public:
  HybridCameraManipulator(std::shared_ptr<EngineCore> engine, std::shared_ptr<ManipulatorCore> core);
  ~HybridCameraManipulator() override;

  void grabBegin(double x, double y, bool strafe) override;
  void grabUpdate(double x, double y) override;
  void grabEnd() override;
  void scroll(double x, double y, double delta) override;
  void jumpToHome() override;
  void setViewport(double width, double height) override;
  LookAt getLookAt() override;
  void dispose() override;

  const std::shared_ptr<EngineCore>& engineCore() const;
  const std::shared_ptr<ManipulatorCore>& core() const;

private:
  template <typename Enqueue> void send(Enqueue&& enqueue);

  std::shared_ptr<EngineCore> engine_;
  std::shared_ptr<ManipulatorCore> core_;
};

} // namespace margelo::nitro::filament
