#pragma once

#include <functional>

namespace margelo::nitro::filament {

struct Job {
  std::function<void()> run;
  std::function<void()> cancel = nullptr;
};

} // namespace margelo::nitro::filament
