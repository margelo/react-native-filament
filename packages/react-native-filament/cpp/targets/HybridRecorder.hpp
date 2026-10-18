#pragma once

#include "HybridRecorderSpec.hpp"
#include "RecorderCore.hpp"

#include <atomic>
#include <memory>

namespace margelo::nitro::filament {

class HybridEngine;

class HybridRecorder final : public HybridRecorderSpec {
public:
  HybridRecorder(std::shared_ptr<HybridEngine> engine, std::shared_ptr<RecorderCore> core);
  ~HybridRecorder() override;

  double getWidth() override;
  double getHeight() override;
  double getFps() override;
  std::shared_ptr<HybridViewSpec> getView() override;
  void setScene(const std::shared_ptr<HybridSceneSpec>& scene) override;
  void setCamera(const std::shared_ptr<HybridCameraSpec>& camera) override;
  void setClearOptions(const ClearOptions& options) override;
  std::shared_ptr<Promise<std::string>> record(double frameCount) override;
  void dispose() override;

private:
  void startEncoder(uint32_t frameCount, const std::shared_ptr<Promise<std::string>>& promise);

  std::shared_ptr<HybridEngine> engine_;
  std::shared_ptr<RecorderCore> core_;
  std::shared_ptr<HybridViewSpec> view_;
  std::shared_ptr<std::atomic<bool>> recording_ = std::make_shared<std::atomic<bool>>(false);
  std::atomic<bool> disposed_{false};
};

} // namespace margelo::nitro::filament
