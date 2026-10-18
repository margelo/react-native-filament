#include "MaterialInstanceRef.hpp"

#include <filament/RenderableManager.h>

#include <stdexcept>
#include <string>

namespace margelo::nitro::filament {

MaterialInstanceRef::MaterialInstanceRef(std::variant<Owned, Default, Borrowed> source) : source_(std::move(source)) {}

const std::shared_ptr<EngineCore>& MaterialInstanceRef::engine() const {
  return std::visit(
      [](const auto& value) -> const std::shared_ptr<EngineCore>& {
        using Source = std::decay_t<decltype(value)>;
        if constexpr (std::is_same_v<Source, Owned>) {
          return value.core->material()->engine();
        } else if constexpr (std::is_same_v<Source, Default>) {
          return value.material->engine();
        } else {
          return value.engine;
        }
      },
      source_);
}

::filament::MaterialInstance& MaterialInstanceRef::require(const char* method) const {
  return std::visit(
      [method](const auto& value) -> ::filament::MaterialInstance& {
        using Source = std::decay_t<decltype(value)>;
        if constexpr (std::is_same_v<Source, Owned>) {
          value.core->requireLive(method);
          return value.core->instance();
        } else if constexpr (std::is_same_v<Source, Default>) {
          value.material->requireLive(method);
          return *value.material->material().getDefaultInstance();
        } else {
          ::filament::RenderableManager& renderables = value.engine->engine().getRenderableManager();
          auto renderable = renderables.getInstance(value.entity);
          if (!renderable.isValid() || value.primitive >= renderables.getPrimitiveCount(renderable) ||
              renderables.getMaterialInstanceAt(renderable, value.primitive) != value.instance) {
            throw std::runtime_error(std::string("FilamentDisposedError: ") + method +
                                     " was called on a material instance whose renderable no longer uses it.");
          }
          return *value.instance;
        }
      },
      source_);
}

const std::variant<MaterialInstanceRef::Owned, MaterialInstanceRef::Default, MaterialInstanceRef::Borrowed>&
MaterialInstanceRef::source() const {
  return source_;
}

std::shared_ptr<void> MaterialInstanceRef::assignableOwner(const char* method) const {
  require(method);
  return std::visit(
      [method](const auto& value) -> std::shared_ptr<void> {
        using Source = std::decay_t<decltype(value)>;
        if constexpr (std::is_same_v<Source, Owned>) {
          return value.core;
        } else if constexpr (std::is_same_v<Source, Default>) {
          return value.material;
        } else {
          throw std::invalid_argument(std::string(method) +
                                      " needs an instance from Material.createInstance() or Material.defaultInstance, not one read from "
                                      "another renderable.");
        }
      },
      source_);
}

} // namespace margelo::nitro::filament
