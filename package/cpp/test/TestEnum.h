//
// Created by Marc Rousavy on 22.02.24.
//

#pragma once

#include "jsi/EnumMapper.h"

namespace margelo {

enum TestEnum { FIRST, SECOND, THIRD };

namespace EnumMapper {
  static void convertJSUnionToEnum(const std::string& inUnion, TestEnum* outEnum) {
    if (inUnion == "first")
      *outEnum = FIRST;
    else if (inUnion == "second")
      *outEnum = SECOND;
    else if (inUnion == "third")
      *outEnum = THIRD;
    else
      throw invalidUnion(inUnion);
  }
  static void convertEnumToJSUnion(TestEnum inEnum, std::string* outUnion) {
    switch (inEnum) {
      case FIRST:
        *outUnion = "first";
        break;
      case SECOND:
        *outUnion = "second";
        break;
      case THIRD:
        *outUnion = "third";
        break;
      default:
        throw invalidEnum(inEnum);
    }
  }
} // namespace EnumMapper
} // namespace margelo