//
// Created by Marc Rousavy on 21.02.24.
//

#pragma once

#include <jsi/jsi.h>

namespace margelo {

using namespace facebook;

// Type conversion templates to and from jsi::Values
template<typename T>
struct JsiTypeTraits {
};

template<>
struct JsiTypeTraits<int> {
    static int fromJsi(jsi::Runtime& runtime, const jsi::Value& value) {
        return value.asNumber();
    }
    static jsi::Value toJsi(jsi::Runtime& runtime, int value) {
        return jsi::Value(value);
    }
};

template<>
struct JsiTypeTraits<bool> {
    static bool fromJsi(jsi::Runtime& runtime, const jsi::Value& value) {
        return value.asNumber();
    }
    static jsi::Value toJsi(jsi::Runtime& runtime, bool value) {
        return jsi::Value(value);
    }
};

template<>
struct JsiTypeTraits<std::string> {
    static std::string fromJsi(jsi::Runtime& runtime, const jsi::Value& value) {
        return value.asString(runtime).utf8(runtime);
    }
    static jsi::Value toJsi(jsi::Runtime& runtime, std::string value) {
        return jsi::String::createFromUtf8(runtime, value);
    }
};

} // margelo

