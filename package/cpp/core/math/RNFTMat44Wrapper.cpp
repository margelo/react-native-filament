
#include "RNFTMat44Wrapper.h"
#include "core/utils/RNFConverter.h"

namespace margelo {

void margelo::TMat44Wrapper::loadHybridMethods() {
  HybridObject::loadHybridMethods();
  registerHybrids(this, [](nitro::Prototype& proto) {
    proto.registerHybridGetter("data", &TMat44Wrapper::getMatrixData);
    proto.registerHybridMethod("scaling", &TMat44Wrapper::scaling);
    proto.registerHybridMethod("translate", &TMat44Wrapper::translate);
    proto.registerHybridMethod("rotate", &TMat44Wrapper::rotate);
    proto.registerHybridGetter("scale", &TMat44Wrapper::getScale);
    proto.registerHybridGetter("translation", &TMat44Wrapper::getTranslation);
  });
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

std::shared_ptr<TMat44Wrapper> TMat44Wrapper::translate(std::vector<double> translation) {
  math::float3 translateVec = Converter::VecToFloat3(translation);
  math::mat4f translateMatrix = math::mat4f::translation(translateVec);
  math::mat4f newMatrix = translateMatrix * _matrix;
  return std::make_shared<TMat44Wrapper>(newMatrix);
}

std::shared_ptr<TMat44Wrapper> TMat44Wrapper::rotate(double angleRadians, std::vector<double> axisVec) {
  math::float3 axis = Converter::VecToFloat3(axisVec);
  if (axis.x == 0 && axis.y == 0 && axis.z == 0) {
    throw std::invalid_argument("Axis cannot be zero");
  }

  math::mat4f rotateMatrix = math::mat4f::rotation(angleRadians, axis);
  math::mat4f newMatrix = rotateMatrix * _matrix;
  return std::make_shared<TMat44Wrapper>(newMatrix);
}

std::vector<double> TMat44Wrapper::getScale() {
  float scaleX = std::sqrt(_matrix[0][0] * _matrix[0][0] + _matrix[0][1] * _matrix[0][1] + _matrix[0][2] * _matrix[0][2]);
  float scaleY = std::sqrt(_matrix[1][0] * _matrix[1][0] + _matrix[1][1] * _matrix[1][1] + _matrix[1][2] * _matrix[1][2]);
  float scaleZ = std::sqrt(_matrix[2][0] * _matrix[2][0] + _matrix[2][1] * _matrix[2][1] + _matrix[2][2] * _matrix[2][2]);

  return {scaleX, scaleY, scaleZ};
}

std::vector<double> TMat44Wrapper::getTranslation() {
  return {_matrix[3][0], _matrix[3][1], _matrix[3][2]};
}
} // namespace margelo