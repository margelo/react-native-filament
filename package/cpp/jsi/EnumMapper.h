//
// Created by Marc Rousavy on 22.02.24.
//

#pragma once

#include "test/TestEnum.h"
#include <unordered_map>

namespace margelo {

using namespace facebook;

static std::runtime_error invalidUnion(const std::string jsUnion) {
  return std::runtime_error("Cannot convert JS Value to Enum: Invalid Union value passed! (\"" + jsUnion + "\")");
}
template <typename Enum> static std::runtime_error invalidEnum(Enum passedEnum) {
  return std::runtime_error("Cannot convert Enum to JS Value: Invalid Enum passed! (Value #" + std::to_string(passedEnum) +
                            " does not exist in " + typeid(Enum).name() + ")");
}

template <typename Enum> struct EnumMapper {
  static Enum fromJSUnion(const std::string&) {
    static_assert(always_false<Enum>::value, "This type is not supported by the EnumMapper!");
    return Enum();
  }
  static std::string toJSUnion(Enum) {
    static_assert(always_false<Enum>::value, "This type is not supported by the EnumMapper!");
    return std::string();
  }

private:
  template <typename> struct always_false : std::false_type {};
};

template <> struct EnumMapper<TestEnum> {
public:
  static constexpr TestEnum fromJSUnion(const std::string& jsUnion) {
    if (jsUnion == "first")
      return FIRST;
    if (jsUnion == "second")
      return SECOND;
    if (jsUnion == "third")
      return THIRD;
    throw invalidUnion(jsUnion);
  }
  static std::string toJSUnion(TestEnum value) {
    switch (value) {
      case FIRST:
        return "first";
      case SECOND:
        return "second";
      case THIRD:
        return "third";
    }
    throw invalidEnum(value);
  }
};

} // namespace margelo
