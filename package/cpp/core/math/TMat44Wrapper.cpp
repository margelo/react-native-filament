
#include "TMat44Wrapper.h"

namespace margelo {

void margelo::TMat44Wrapper::loadHybridMethods() {
  registerHybridGetter("data", &TMat44Wrapper::getMatrixData, this);
  registerHybridMethod("scaling", &TMat44Wrapper::scaling, this);
  registerHybridGetter("scale", &TMat44Wrapper::getScale, this);
}

std::vector<double> TMat44Wrapper::getMatrixData() {
  std::vector<double> data;
  data.reserve(16);
  const float* array = _mat.asArray();
  for (int i = 0; i < 16; i++) {
    data.push_back((double)array[i]);
  }
  return data;
}
std::shared_ptr<TMat44Wrapper> TMat44Wrapper::scaling(double x, double y, double z) {
  return std::make_shared<TMat44Wrapper>(_mat * math::mat4f::scaling(math::float3(x, y, z)));
}
std::vector<double> TMat44Wrapper::getScale() {
  float scaleX = std::sqrt(_mat[0][0] * _mat[0][0] + _mat[0][1] * _mat[0][1] + _mat[0][2] * _mat[0][2]);
  float scaleY = std::sqrt(_mat[1][0] * _mat[1][0] + _mat[1][1] * _mat[1][1] + _mat[1][2] * _mat[1][2]);
  float scaleZ = std::sqrt(_mat[2][0] * _mat[2][0] + _mat[2][1] * _mat[2][1] + _mat[2][2] * _mat[2][2]);

  return {scaleX, scaleY, scaleZ};
}
} // namespace margelo