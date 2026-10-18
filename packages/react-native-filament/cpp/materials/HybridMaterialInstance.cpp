#include "HybridMaterialInstance.hpp"

#include "HybridTexture.hpp"
#include "SamplerConversion.hpp"
#include "utils/EngineChecks.hpp"
#include "utils/MatrixConversion.hpp"
#include "utils/ThreadChecks.hpp"

#include <stdexcept>
#include <string>
#include <vector>

namespace margelo::nitro::filament {

namespace {

  using ParameterInfo = ::filament::Material::ParameterInfo;
  using UniformType = ::filament::backend::UniformType;

  std::optional<ParameterInfo> findParameter(const ::filament::Material& material, const std::string& name) {
    std::vector<ParameterInfo> parameters(material.getParameterCount());
    material.getParameters(parameters.data(), parameters.size());
    for (const ParameterInfo& parameter : parameters) {
      if (name == parameter.name) {
        return parameter;
      }
    }
    return std::nullopt;
  }

  bool isUniform(const ParameterInfo& parameter, UniformType type) {
    return !parameter.isSampler && !parameter.isSubpass && parameter.type == type;
  }

  ::filament::backend::CullingMode toFilamentCulling(CullingMode mode) {
    switch (mode) {
      case CullingMode::NONE:
        return ::filament::backend::CullingMode::NONE;
      case CullingMode::BACK:
        return ::filament::backend::CullingMode::BACK;
      case CullingMode::FRONT:
        return ::filament::backend::CullingMode::FRONT;
      case CullingMode::FRONT_AND_BACK:
        return ::filament::backend::CullingMode::FRONT_AND_BACK;
    }
  }

  CullingMode fromFilamentCulling(::filament::backend::CullingMode mode) {
    switch (mode) {
      case ::filament::backend::CullingMode::NONE:
        return CullingMode::NONE;
      case ::filament::backend::CullingMode::BACK:
        return CullingMode::BACK;
      case ::filament::backend::CullingMode::FRONT:
        return CullingMode::FRONT;
      case ::filament::backend::CullingMode::FRONT_AND_BACK:
        return CullingMode::FRONT_AND_BACK;
    }
  }

  ::filament::TransparencyMode toFilamentTransparency(TransparencyMode mode) {
    switch (mode) {
      case TransparencyMode::DEFAULT:
        return ::filament::TransparencyMode::DEFAULT;
      case TransparencyMode::TWO_PASSES_ONE_SIDE:
        return ::filament::TransparencyMode::TWO_PASSES_ONE_SIDE;
      case TransparencyMode::TWO_PASSES_TWO_SIDES:
        return ::filament::TransparencyMode::TWO_PASSES_TWO_SIDES;
    }
  }

  TransparencyMode fromFilamentTransparency(::filament::TransparencyMode mode) {
    switch (mode) {
      case ::filament::TransparencyMode::DEFAULT:
        return TransparencyMode::DEFAULT;
      case ::filament::TransparencyMode::TWO_PASSES_ONE_SIDE:
        return TransparencyMode::TWO_PASSES_ONE_SIDE;
      case ::filament::TransparencyMode::TWO_PASSES_TWO_SIDES:
        return TransparencyMode::TWO_PASSES_TWO_SIDES;
    }
  }

  std::tuple<double, double, double> toTuple(const ::filament::math::float3& value) {
    return {value.x, value.y, value.z};
  }

  ::filament::math::float4 toFloat4(const std::tuple<double, double, double, double>& value) {
    auto [x, y, z, w] = value;
    return {static_cast<float>(x), static_cast<float>(y), static_cast<float>(z), static_cast<float>(w)};
  }

} // namespace

HybridMaterialInstance::HybridMaterialInstance(MaterialInstanceRef ref) : HybridObject(TAG), ref_(std::move(ref)) {}

std::string HybridMaterialInstance::getInstanceName() {
  const char* name = usable("MaterialInstance.instanceName").getName();
  return name == nullptr ? "" : name;
}

std::string HybridMaterialInstance::getMaterialName() {
  return usable("MaterialInstance.materialName").getMaterial()->getName();
}

CullingMode HybridMaterialInstance::getCullingMode() {
  return fromFilamentCulling(usable("MaterialInstance.cullingMode").getCullingMode());
}

void HybridMaterialInstance::setCullingMode(CullingMode cullingMode) {
  usable("MaterialInstance.cullingMode").setCullingMode(toFilamentCulling(cullingMode));
}

TransparencyMode HybridMaterialInstance::getTransparencyMode() {
  return fromFilamentTransparency(usable("MaterialInstance.transparencyMode").getTransparencyMode());
}

void HybridMaterialInstance::setTransparencyMode(TransparencyMode transparencyMode) {
  usable("MaterialInstance.transparencyMode").setTransparencyMode(toFilamentTransparency(transparencyMode));
}

bool HybridMaterialInstance::hasParameter(const std::string& name) {
  return usable("MaterialInstance.hasParameter()").getMaterial()->hasParameter(name.c_str());
}

void HybridMaterialInstance::setFloatParameter(const std::string& name, double value) {
  parameter(name, "MaterialInstance.setFloatParameter()", "float", [](const ParameterInfo& p) {
    return isUniform(p, UniformType::FLOAT);
  }).setParameter(name.c_str(), static_cast<float>(value));
}

void HybridMaterialInstance::setIntParameter(const std::string& name, double value) {
  parameter(name, "MaterialInstance.setIntParameter()", "int", [](const ParameterInfo& p) {
    return isUniform(p, UniformType::INT);
  }).setParameter(name.c_str(), static_cast<int32_t>(value));
}

void HybridMaterialInstance::setFloat3Parameter(const std::string& name, const std::tuple<double, double, double>& value) {
  parameter(name, "MaterialInstance.setFloat3Parameter()", "float3", [](const ParameterInfo& p) {
    return isUniform(p, UniformType::FLOAT3);
  }).setParameter(name.c_str(), toFloat3(value));
}

void HybridMaterialInstance::setFloat4Parameter(const std::string& name, const std::tuple<double, double, double, double>& value) {
  parameter(name, "MaterialInstance.setFloat4Parameter()", "float4", [](const ParameterInfo& p) {
    return isUniform(p, UniformType::FLOAT4);
  }).setParameter(name.c_str(), toFloat4(value));
}

void HybridMaterialInstance::setMat3Parameter(const std::string& name, const Mat3Tuple& value) {
  parameter(name, "MaterialInstance.setMat3Parameter()", "mat3", [](const ParameterInfo& p) {
    return isUniform(p, UniformType::MAT3);
  }).setParameter(name.c_str(), toMat3f(value));
}

void HybridMaterialInstance::setColorParameter(const std::string& name, const std::tuple<double, double, double, double>& color,
                                               ColorSpace colorSpace) {
  bool isFloat4 = false;
  ::filament::MaterialInstance& instance =
      parameter(name, "MaterialInstance.setColorParameter()", "float3 or float4", [&isFloat4](const ParameterInfo& p) {
        isFloat4 = isUniform(p, UniformType::FLOAT4);
        return isFloat4 || isUniform(p, UniformType::FLOAT3);
      });
  ::filament::math::float4 rgba = toFloat4(color);
  if (isFloat4) {
    instance.setParameter(name.c_str(), colorSpace == ColorSpace::SRGB ? ::filament::RgbaType::sRGB : ::filament::RgbaType::LINEAR, rgba);
  } else {
    instance.setParameter(name.c_str(), colorSpace == ColorSpace::SRGB ? ::filament::RgbType::sRGB : ::filament::RgbType::LINEAR, rgba.rgb);
  }
}

double HybridMaterialInstance::getFloatParameter(const std::string& name) {
  return parameter(name, "MaterialInstance.getFloatParameter()", "float",
                   [](const ParameterInfo& p) { return isUniform(p, UniformType::FLOAT); })
      .getParameter<float>(name.c_str());
}

double HybridMaterialInstance::getIntParameter(const std::string& name) {
  return parameter(name, "MaterialInstance.getIntParameter()", "int", [](const ParameterInfo& p) { return isUniform(p, UniformType::INT); })
      .getParameter<int32_t>(name.c_str());
}

std::tuple<double, double, double> HybridMaterialInstance::getFloat3Parameter(const std::string& name) {
  return toTuple(parameter(name, "MaterialInstance.getFloat3Parameter()", "float3", [](const ParameterInfo& p) {
                   return isUniform(p, UniformType::FLOAT3);
                 }).getParameter<::filament::math::float3>(name.c_str()));
}

std::tuple<double, double, double, double> HybridMaterialInstance::getFloat4Parameter(const std::string& name) {
  ::filament::math::float4 value = parameter(name, "MaterialInstance.getFloat4Parameter()", "float4", [](const ParameterInfo& p) {
                                     return isUniform(p, UniformType::FLOAT4);
                                   }).getParameter<::filament::math::float4>(name.c_str());
  return {value.x, value.y, value.z, value.w};
}

void HybridMaterialInstance::setTexture(const std::string& name, const std::shared_ptr<HybridTextureSpec>& texture,
                                        const SamplerOptions& sampler) {
  ::filament::MaterialInstance& instance =
      parameter(name, "MaterialInstance.setTexture()", "sampler", [](const ParameterInfo& p) { return p.isSampler; });
  auto resolved = requireSameEngine<HybridTexture>(texture, *ref_.engine(), "MaterialInstance.setTexture()");
  resolved->core()->requireLive("MaterialInstance.setTexture()");
  ref_.engine()->materialAssignments().bindTexture(&instance, name, &resolved->core()->texture(), toTextureSampler(sampler),
                                                   resolved->core());
}

void HybridMaterialInstance::dispose() {
  if (const auto* owned = std::get_if<MaterialInstanceRef::Owned>(&ref_.source())) {
    ref_.engine()->dispose(owned->core);
  }
}

const std::shared_ptr<EngineCore>& HybridMaterialInstance::engineCore() const {
  return ref_.engine();
}

const MaterialInstanceRef& HybridMaterialInstance::ref() const {
  return ref_;
}

::filament::MaterialInstance& HybridMaterialInstance::usable(const char* method) {
  requireRenderThread(ref_.engine()->thread(), method);
  return ref_.require(method);
}

::filament::MaterialInstance& HybridMaterialInstance::parameter(const std::string& name, const char* method, const char* expected,
                                                                const std::function<bool(const ParameterInfo&)>& accepts) {
  ::filament::MaterialInstance& instance = usable(method);
  std::optional<ParameterInfo> info = findParameter(*instance.getMaterial(), name);
  if (!info.has_value()) {
    throw std::invalid_argument(std::string(method) + ": the material \"" + instance.getMaterial()->getName() + "\" has no parameter \"" +
                                name + "\".");
  }
  if (!accepts(*info)) {
    throw std::invalid_argument(std::string(method) + ": the parameter \"" + name + "\" is not a " + expected + ".");
  }
  return instance;
}

} // namespace margelo::nitro::filament
