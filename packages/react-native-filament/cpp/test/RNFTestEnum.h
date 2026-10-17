//
// Created by Marc Rousavy on 22.02.24.
//

#pragma once

#include "jsi/RNFEnumMapper.h"

namespace margelo {

enum class TestEnum : uint8_t { FIRST, SECOND, THIRD };

namespace EnumMapper {
  static void convertJSUnionToEnum(const std::string& inUnion, TestEnum* outEnum) {
    if (inUnion == "first")
      *outEnum = TestEnum::FIRST;
    else if (inUnion == "second")
      *outEnum = TestEnum::SECOND;
    else if (inUnion == "third")
      *outEnum = TestEnum::THIRD;
    else
      throw invalidUnion(inUnion);
  }
  static void convertEnumToJSUnion(TestEnum inEnum, std::string* outUnion) {
    switch (inEnum) {
      case TestEnum::FIRST:
        *outUnion = "first";
        break;
      case TestEnum::SECOND:
        *outUnion = "second";
        break;
      case TestEnum::THIRD:
        *outUnion = "third";
        break;
      default:
        throw invalidEnum(inEnum);
    }
  }
} // namespace EnumMapper
} // namespace margelo