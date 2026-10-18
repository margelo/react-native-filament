#pragma once

#include "EngineBackend.hpp"

#include <backend/DriverEnums.h>

#include <string>

namespace margelo::nitro::filament {

inline ::filament::backend::Backend toFilamentBackend(EngineBackend backend) {
  switch (backend) {
    case EngineBackend::METAL:
      return ::filament::backend::Backend::METAL;
    case EngineBackend::OPENGL:
      return ::filament::backend::Backend::OPENGL;
    case EngineBackend::VULKAN:
      return ::filament::backend::Backend::VULKAN;
  }
}

inline std::string backendName(EngineBackend backend) {
  switch (backend) {
    case EngineBackend::METAL:
      return "metal";
    case EngineBackend::OPENGL:
      return "opengl";
    case EngineBackend::VULKAN:
      return "vulkan";
  }
}

} // namespace margelo::nitro::filament
