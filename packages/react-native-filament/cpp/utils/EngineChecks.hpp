#pragma once

#include "engine/EngineCore.hpp"

#include <memory>
#include <stdexcept>
#include <string>

namespace margelo::nitro::filament {

template <typename Implementation, typename Spec>
std::shared_ptr<Implementation> requireSameEngine(const std::shared_ptr<Spec>& object, const EngineCore& engine, const char* method) {
  auto implementation = std::dynamic_pointer_cast<Implementation>(object);
  if (implementation == nullptr || implementation->engineCore().get() != &engine) {
    throw std::invalid_argument(std::string("FilamentEngineMismatchError: ") + method +
                                " received an object that belongs to another Engine.");
  }
  return implementation;
}

} // namespace margelo::nitro::filament
