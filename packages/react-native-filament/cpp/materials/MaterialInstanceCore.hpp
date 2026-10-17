#pragma once

#include "MaterialCore.hpp"
#include "TextureCore.hpp"
#include "resources/Resource.hpp"

#include <filament/MaterialInstance.h>

#include <memory>
#include <string>
#include <unordered_map>

namespace margelo::nitro::filament {

class MaterialInstanceCore final : public Resource {
public:
  explicit MaterialInstanceCore(std::shared_ptr<MaterialCore> material);
  ~MaterialInstanceCore() override;

  const std::shared_ptr<MaterialCore>& material() const;
  ::filament::MaterialInstance& instance();

protected:
  void destroyNative() override;

private:
  std::shared_ptr<MaterialCore> material_;
  ::filament::MaterialInstance* instance_;
};

} // namespace margelo::nitro::filament
