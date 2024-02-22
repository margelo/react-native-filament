//
// Created by Marc Rousavy on 22.02.24.
//

#pragma once

#include "jsi/EnumMapper.h"

namespace margelo {

enum TestEnum {
    FIRST,
    SECOND,
    THIRD
};

class TestEnumMapper : public EnumMapper<TestEnum> {
    std::unordered_map<TestEnum, std::string> getMapping() {
        return {
                {FIRST, "first"},
                {SECOND, "second"},
                {THIRD, "third"},
        };
    }
};

}