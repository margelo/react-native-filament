//
// Created by Hanno Gödecke on 11.04.24.
//

#pragma once

#include <filament/Engine.h>
#include <optional>
#include <unordered_map>

namespace margelo {

using namespace filament;

class EngineConfigHelper {
public:
  static Engine::Config makeConfigFromUserParams(std::optional<std::unordered_map<std::string, int>> arguments = std::nullopt);
};

} // namespace margelo
