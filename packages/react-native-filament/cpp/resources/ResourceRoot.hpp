#pragma once

#include "Resource.hpp"

namespace margelo::nitro::filament {

class ResourceRoot final : public Resource {
public:
  ResourceRoot() : Resource("Engine") {}

protected:
  void destroyNative() override {}
};

} // namespace margelo::nitro::filament
