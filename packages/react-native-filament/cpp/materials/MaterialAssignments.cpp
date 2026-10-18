#include "MaterialAssignments.hpp"

#include <filament/RenderableManager.h>

#include <algorithm>

namespace margelo::nitro::filament {

void MaterialAssignments::assign(::filament::Engine& engine, utils::Entity entity, size_t primitive, ::filament::MaterialInstance* instance,
                                 std::shared_ptr<void> keepAlive) {
  ::filament::RenderableManager& renderables = engine.getRenderableManager();
  renderables.setMaterialInstanceAt(renderables.getInstance(entity), primitive, instance);
  std::erase_if(assignments_, [&](const Assignment& existing) { return existing.entity == entity && existing.primitive == primitive; });
  assignments_.push_back({.entity = entity, .primitive = primitive, .instance = instance, .keepAlive = std::move(keepAlive)});
}

void MaterialAssignments::bindTexture(::filament::MaterialInstance* instance, const std::string& name, ::filament::Texture* texture,
                                      ::filament::TextureSampler sampler, std::shared_ptr<void> keepAlive) {
  instance->setParameter(name.c_str(), texture, sampler);
  std::erase_if(bindings_, [&](const Binding& existing) { return existing.instance == instance && existing.name == name; });
  bindings_.push_back({.instance = instance, .name = name, .texture = texture, .sampler = sampler, .keepAlive = std::move(keepAlive)});
}

void MaterialAssignments::releaseInstance(::filament::MaterialInstance* instance, ::filament::MaterialInstance* fallback,
                                          ::filament::Engine& engine) {
  ::filament::RenderableManager& renderables = engine.getRenderableManager();
  for (Assignment& assignment : assignments_) {
    auto renderable = renderables.getInstance(assignment.entity);
    if (assignment.instance == instance && renderable.isValid()) {
      renderables.setMaterialInstanceAt(renderable, assignment.primitive, fallback);
      assignment.instance = fallback;
      assignment.keepAlive.reset();
    }
  }
  std::erase_if(bindings_, [&](const Binding& binding) { return binding.instance == instance; });
}

void MaterialAssignments::releaseMaterial(const ::filament::Material* material, ::filament::Engine& engine) {
  ::filament::RenderableManager& renderables = engine.getRenderableManager();
  const ::filament::MaterialInstance* fallback = const_cast<::filament::Material*>(engine.getDefaultMaterial())->getDefaultInstance();
  std::erase_if(assignments_, [&](const Assignment& assignment) {
    if (assignment.instance->getMaterial() != material) {
      return false;
    }
    auto renderable = renderables.getInstance(assignment.entity);
    if (renderable.isValid()) {
      renderables.setMaterialInstanceAt(renderable, assignment.primitive, fallback);
    }
    return true;
  });
  std::erase_if(bindings_, [&](const Binding& binding) { return binding.instance->getMaterial() == material; });
}

void MaterialAssignments::releaseTexture(const ::filament::Texture* texture) {
  std::erase_if(bindings_, [&](const Binding& binding) {
    if (binding.texture != texture) {
      return false;
    }
    binding.instance->setParameter(binding.name.c_str(), nullptr, binding.sampler);
    return true;
  });
}

void MaterialAssignments::releaseEntities(const utils::Entity* entities, size_t count, ::filament::MaterialInstance* const* instances,
                                          size_t instanceCount) {
  std::erase_if(assignments_,
                [&](const Assignment& assignment) { return std::find(entities, entities + count, assignment.entity) != entities + count; });
  std::erase_if(bindings_, [&](const Binding& binding) {
    return std::find(instances, instances + instanceCount, binding.instance) != instances + instanceCount;
  });
}

void MaterialAssignments::clear() {
  assignments_.clear();
  bindings_.clear();
}

} // namespace margelo::nitro::filament
