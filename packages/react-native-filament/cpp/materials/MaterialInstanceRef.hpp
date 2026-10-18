#pragma once

#include "MaterialCore.hpp"
#include "MaterialInstanceCore.hpp"
#include "engine/EngineCore.hpp"

#include <filament/MaterialInstance.h>
#include <utils/Entity.h>

#include <memory>
#include <variant>

namespace margelo::nitro::filament {

class MaterialInstanceRef final {
public:
  struct Owned {
    std::shared_ptr<MaterialInstanceCore> core;
  };
  struct Default {
    std::shared_ptr<MaterialCore> material;
  };
  struct Borrowed {
    std::shared_ptr<EngineCore> engine;
    utils::Entity entity;
    size_t primitive;
    ::filament::MaterialInstance* instance;
  };

  explicit MaterialInstanceRef(std::variant<Owned, Default, Borrowed> source);

  const std::shared_ptr<EngineCore>& engine() const;
  ::filament::MaterialInstance& require(const char* method) const;
  std::shared_ptr<void> assignableOwner(const char* method) const;
  const std::variant<Owned, Default, Borrowed>& source() const;

private:
  std::variant<Owned, Default, Borrowed> source_;
};

} // namespace margelo::nitro::filament
