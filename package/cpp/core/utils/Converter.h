//
// Created by Hanno Gödecke on 29.02.24.
//

#pragma once

#include <math/vec3.h>

namespace margelo {

class Converter {
public:
  static math::float3 VecToFloat3(std::vector<double> vec) {
    if (vec.size() != 3) {
      throw std::invalid_argument("Point must have 3 elements");
    }

    return math::float3(vec[0], vec[1], vec[2]);
  }

  static std::vector<double> Float3ToVec(const math::float3& vec) {
    return {vec.x, vec.y, vec.z};
  }

  /**
   * Converts a hex string to a filament float vector with the 4 color components in sRGB linear space.
   * It can convert both strings with and without alpha component.
   */
  static math::float4 hexColorToSRGBLinear(std::string hexColor) {
    if (hexColor.front() != '#' || (hexColor.length() != 7 && hexColor.length() != 9)) {
      throw new std::invalid_argument("Invalid hex color format");
    }

    // Extract color components
    int r = std::stoi(hexColor.substr(1, 2), nullptr, 16);
    int g = std::stoi(hexColor.substr(3, 2), nullptr, 16);
    int b = std::stoi(hexColor.substr(5, 2), nullptr, 16);

    // Check if alpha component is present
    int a = 255;
    if (hexColor.length() == 9) {
      a = std::stoi(hexColor.substr(7, 2), nullptr, 16);
    }

    math::float4 sRGBColorA = {r / 255.0f, g / 255.0f, b / 255.0f, a / 255.0f};
    return sRGBColorA;
  }
};
} // namespace margelo
