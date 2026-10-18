#pragma once

#include <filament/Engine.h>
#include <filament/Material.h>
#include <filament/MaterialInstance.h>
#include <filament/Texture.h>
#include <filament/TextureSampler.h>
#include <utils/Entity.h>

#include <memory>
#include <string>
#include <vector>

namespace margelo::nitro::filament {

class MaterialAssignments final {
public:
  void assign(::filament::Engine& engine, utils::Entity entity, size_t primitive, ::filament::MaterialInstance* instance,
              std::shared_ptr<void> keepAlive);
  void bindTexture(::filament::MaterialInstance* instance, const std::string& name, ::filament::Texture* texture,
                   ::filament::TextureSampler sampler, std::shared_ptr<void> keepAlive);
  void releaseInstance(::filament::MaterialInstance* instance, ::filament::MaterialInstance* fallback, ::filament::Engine& engine);
  void releaseMaterial(const ::filament::Material* material, ::filament::Engine& engine);
  void releaseTexture(const ::filament::Texture* texture);
  void releaseEntities(const utils::Entity* entities, size_t count, ::filament::MaterialInstance* const* instances, size_t instanceCount);
  void clear();

private:
  struct Assignment {
    utils::Entity entity;
    size_t primitive;
    ::filament::MaterialInstance* instance;
    std::shared_ptr<void> keepAlive;
  };

  struct Binding {
    ::filament::MaterialInstance* instance;
    std::string name;
    const ::filament::Texture* texture;
    ::filament::TextureSampler sampler;
    std::shared_ptr<void> keepAlive;
  };

  std::vector<Assignment> assignments_;
  std::vector<Binding> bindings_;
};

} // namespace margelo::nitro::filament
