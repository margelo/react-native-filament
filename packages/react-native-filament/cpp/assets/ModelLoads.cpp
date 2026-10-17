#include "ModelLoads.hpp"

#include <stdexcept>

namespace margelo::nitro::filament {

void ModelLoads::start(std::unique_ptr<ModelLoad> load) {
  if (load->begin()) {
    loads_.push_back(std::move(load));
  }
}

void ModelLoads::update() {
  std::erase_if(loads_, [](const std::unique_ptr<ModelLoad>& load) { return load->update(); });
}

void ModelLoads::cancelAll() {
  std::vector<std::unique_ptr<ModelLoad>> cancelled;
  cancelled.swap(loads_);
  for (const std::unique_ptr<ModelLoad>& load : cancelled) {
    load->cancel(std::make_exception_ptr(std::runtime_error("The Engine was shut down while the model was loading.")));
  }
}

bool ModelLoads::empty() const {
  return loads_.empty();
}

} // namespace margelo::nitro::filament
