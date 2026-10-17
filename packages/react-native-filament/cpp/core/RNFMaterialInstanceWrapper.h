//
// Created by Hanno Gödecke on 20.03.24.
//

#pragma once

#include <filament/MaterialInstance.h>

#include "jsi/RNFHybridObject.h"

namespace margelo {

using namespace filament;

class MaterialInstanceWrapper : public HybridObject {

public:
  explicit MaterialInstanceWrapper(MaterialInstance* materialInstance)
      : HybridObject("MaterialInstanceWrapper"), _materialInstance(materialInstance) {}

  void loadHybridMethods() override;

  // Convenience method for updating baseColorFactor parameter
  static void changeAlpha(MaterialInstance* materialInstance, double alpha);

public: // Public API
  void setCullingMode(std::string mode);
  void setTransparencyMode(std::string mode);
  // Convenience method for updating baseColorFactor parameter
  void changeAlpha(double alpha);
  void setFloatParameter(std::string name, double value);
  void setIntParameter(std::string name, int value);
  void setFloat3Parameter(std::string name, std::vector<double> vector);
  void setFloat4Parameter(std::string name, std::vector<double> vector);
  void setMat3fParameter(std::string name, std::vector<double> value);
  double getFloatParameter(std::string name);
  int getIntParameter(std::string name);
  std::vector<double> getFloat3Parameter(std::string name);
  std::vector<double> getFloat4Parameter(std::string name);
  std::vector<double> getMat3fParameter(std::string name);
  std::string getName();

public: // Internal API
  MaterialInstance* getMaterialInstance() {
    return _materialInstance;
  }

private:
  std::mutex _mutex;
  MaterialInstance* _materialInstance;
};

} // namespace margelo
