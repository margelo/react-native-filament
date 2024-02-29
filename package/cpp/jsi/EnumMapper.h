//
// Created by Marc Rousavy on 22.02.24.
//

#pragma once

#include <stdexcept>
#include <string>

namespace margelo {

namespace EnumMapper {
  // Add these two methods in namespace "EnumMapper" to allow parsing a custom enum:
  // 1. `static void convertJSUnionToEnum(const std::string& inUnion, Enum* outEnum)`
  // 2. `static void convertEnumToJSUnion(Enum inEnum, std::string* outUnion)`

  template<typename TEnum>
  static std::runtime_error invalidUnion(const std::string& passedUnion) {
    return std::runtime_error("Cannot convert JS Value to Enum: Invalid Union value passed! (\"" + std::string(passedUnion) + "\")");
  }

  template <typename T> static std::runtime_error invalidEnum(T passedEnum) {
    return std::runtime_error("Cannot convert Enum to JS Value: Invalid Enum passed! (Value #" +
                              std::to_string(static_cast<int>(passedEnum)) + ")");
  }

    template<typename TEnum>
  static void convertJSUnionToEnum(const std::string& inUnion, TEnum*) {
    throw invalidUnion<TEnum>(inUnion);
  }

    template<typename TEnum>
  static void convertEnumToJSUnion(TEnum inEnum, std::string*) {
    throw invalidEnum<TEnum>(inEnum);
  }
} // namespace EnumMapper

} // namespace margelo
