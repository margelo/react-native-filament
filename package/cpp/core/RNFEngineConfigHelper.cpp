//
// Created by Hanno Gödecke on 11.04.24.
//

#include "RNFEngineConfigHelper.h"

namespace margelo {
Engine::Config EngineConfigHelper::makeConfigFromUserParams(std::optional<std::unordered_map<std::string, int>> arguments) {
  Engine::Config config = {};

  if (!arguments.has_value()) {
    return config;
  }

  auto& params = arguments.value();
  if (params.find("minCommandBufferSizeMB") != params.end()) {
    config.minCommandBufferSizeMB = static_cast<uint32_t>(params["minCommandBufferSizeMB"]);
  }
  if (params.find("commandBufferSizeMB") != params.end()) {
    config.commandBufferSizeMB = static_cast<uint32_t>(params["commandBufferSizeMB"]);
  }
  if (params.find("driverHandleArenaSizeMB") != params.end()) {
    config.driverHandleArenaSizeMB = static_cast<uint32_t>(params["driverHandleArenaSizeMB"]);
  }
  if (params.find("perFrameCommandsSizeMB") != params.end()) {
    config.perFrameCommandsSizeMB = static_cast<uint32_t>(params["perFrameCommandsSizeMB"]);
  }
  if (params.find("perRenderPassArenaSizeMB") != params.end()) {
    config.perRenderPassArenaSizeMB = static_cast<uint32_t>(params["perRenderPassArenaSizeMB"]);
  }
  if (params.find("jobSystemThreadCount") != params.end()) {
    config.jobSystemThreadCount = static_cast<uint32_t>(params["jobSystemThreadCount"]);
  }
  if (params.find("textureUseAfterFreePoolSize") != params.end()) {
    config.textureUseAfterFreePoolSize = static_cast<size_t>(params["textureUseAfterFreePoolSize"]);
  }
  if (params.find("resourceAllocatorCacheMaxAge") != params.end()) {
    config.resourceAllocatorCacheMaxAge = static_cast<uint32_t>(params["resourceAllocatorCacheMaxAge"]);
  }

  return config;
}
} // namespace margelo