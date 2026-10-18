#pragma once

#include "HybridMaterialInstanceSpec.hpp"
#include "MaterialInstanceRef.hpp"

#include <filament/Material.h>

#include <functional>

namespace margelo::nitro::filament {

class HybridMaterialInstance final : public HybridMaterialInstanceSpec {
public:
  explicit HybridMaterialInstance(MaterialInstanceRef ref);

  std::string getInstanceName() override;
  std::string getMaterialName() override;
  CullingMode getCullingMode() override;
  void setCullingMode(CullingMode cullingMode) override;
  TransparencyMode getTransparencyMode() override;
  void setTransparencyMode(TransparencyMode transparencyMode) override;
  bool hasParameter(const std::string& name) override;
  void setFloatParameter(const std::string& name, double value) override;
  void setIntParameter(const std::string& name, double value) override;
  void setFloat3Parameter(const std::string& name, const std::tuple<double, double, double>& value) override;
  void setFloat4Parameter(const std::string& name, const std::tuple<double, double, double, double>& value) override;
  void setMat3Parameter(const std::string& name,
                        const std::tuple<double, double, double, double, double, double, double, double, double>& value) override;
  void setColorParameter(const std::string& name, const std::tuple<double, double, double, double>& color, ColorSpace colorSpace) override;
  double getFloatParameter(const std::string& name) override;
  double getIntParameter(const std::string& name) override;
  std::tuple<double, double, double> getFloat3Parameter(const std::string& name) override;
  std::tuple<double, double, double, double> getFloat4Parameter(const std::string& name) override;
  void setTexture(const std::string& name, const std::shared_ptr<HybridTextureSpec>& texture, const SamplerOptions& sampler) override;
  void dispose() override;

  const std::shared_ptr<EngineCore>& engineCore() const;
  const MaterialInstanceRef& ref() const;

private:
  ::filament::MaterialInstance& usable(const char* method);
  ::filament::MaterialInstance& parameter(const std::string& name, const char* method, const char* expected,
                                          const std::function<bool(const ::filament::Material::ParameterInfo&)>& accepts);

  MaterialInstanceRef ref_;
};

} // namespace margelo::nitro::filament
