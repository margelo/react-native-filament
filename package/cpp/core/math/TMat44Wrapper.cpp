
#include "TMat44Wrapper.h"
#include "core/utils/Converter.h"

namespace margelo {

void margelo::TMat44Wrapper::loadHybridMethods() {
  registerHybridGetter("data", &TMat44Wrapper::getMatrixData, this);
  registerHybridGetter("scale", &TMat44Wrapper::getScale, this);
  registerHybridMethod("scaling", &TMat44Wrapper::scaling, this);
}

std::vector<double> TMat44Wrapper::getMatrixData() {
  std::vector<double> data;
  data.reserve(16);
  const float* array = _matrix.asArray();
  for (int i = 0; i < 16; i++) {
    data.push_back((double)array[i]);
  }
  return data;
}
std::shared_ptr<TMat44Wrapper> TMat44Wrapper::scaling(std::vector<double> scale) {
  math::float3 scaleVec = Converter::VecToFloat3(scale);
  math::mat4f scaleMatrix = math::mat4f::scaling(scaleVec);
  math::mat4f newMatrix = scaleMatrix * _matrix;
  return std::make_shared<TMat44Wrapper>(newMatrix);
}
std::vector<double> TMat44Wrapper::getScale() {
  float scaleX = std::sqrt(_matrix[0][0] * _matrix[0][0] + _matrix[0][1] * _matrix[0][1] + _matrix[0][2] * _matrix[0][2]);
  float scaleY = std::sqrt(_matrix[1][0] * _matrix[1][0] + _matrix[1][1] * _matrix[1][1] + _matrix[1][2] * _matrix[1][2]);
  float scaleZ = std::sqrt(_matrix[2][0] * _matrix[2][0] + _matrix[2][1] * _matrix[2][1] + _matrix[2][2] * _matrix[2][2]);

  return {scaleX, scaleY, scaleZ};
}
} // namespace margelo