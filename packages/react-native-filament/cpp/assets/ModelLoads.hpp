#pragma once

#include "ModelLoad.hpp"

#include <memory>
#include <vector>

namespace margelo::nitro::filament {

class ModelLoads final {
public:
  void start(std::unique_ptr<ModelLoad> load);
  void update();
  void cancelAll();
  bool empty() const;

private:
  std::vector<std::unique_ptr<ModelLoad>> loads_;
};

} // namespace margelo::nitro::filament
