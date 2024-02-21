//
// Created by Marc Rousavy on 21.02.24.
//

#pragma once

#include <jsi/jsi.h>
#include <unordered_map>

namespace margelo {

using namespace facebook;

template<typename ArgType>
struct JSIConverter {
    static ArgType fromJSI(jsi::Runtime&, const jsi::Value&) {
        static_assert(always_false<ArgType>::value, "This type is not supported by the JSIConverter!");
        return ArgType();
    }

private:
    template<typename>
    struct always_false : std::false_type {};
};

template<>
struct JSIConverter<int> {
    static int fromJSI(jsi::Runtime&, const jsi::Value& arg) {
        return static_cast<int>(arg.asNumber());
    }
};

template<>
struct JSIConverter<double> {
    static double fromJSI(jsi::Runtime&, const jsi::Value& arg) {
        return arg.asNumber();
    }
};

template<>
struct JSIConverter<int64_t> {
    static double fromJSI(jsi::Runtime& runtime, const jsi::Value& arg) {
        return arg.asBigInt(runtime).asInt64(runtime);
    }
};

template<>
struct JSIConverter<uint64_t> {
    static double fromJSI(jsi::Runtime& runtime, const jsi::Value& arg) {
        return arg.asBigInt(runtime).asUint64(runtime);
    }
};

template<>
struct JSIConverter<bool> {
    static bool fromJSI(jsi::Runtime&, const jsi::Value& arg) {
        return arg.asBool();
    }
};

template<>
struct JSIConverter<std::string> {
    static std::string fromJSI(jsi::Runtime& runtime, const jsi::Value& arg) {
        return arg.asString(runtime).utf8(runtime);
    }
};

template<typename ElementType>
struct JSIConverter<std::vector<ElementType>> {
    static std::vector<ElementType> convert(jsi::Runtime& runtime, const jsi::Value& arg) {
        jsi::Array array = arg.asObject(runtime).asArray(runtime);
        size_t length = array.size(runtime);

        std::vector<ElementType> vector;
        vector.reserve(length);
        for (size_t i = 0; i < length; ++i) {
            jsi::Value elementValue = array.getValueAtIndex(runtime, i);
            vector.emplace_back(JSIConverter<ElementType>::convert(runtime, elementValue));
        }
        return vector;
    }
};

template<typename ValueType>
struct JSIConverter<std::unordered_map<std::string, ValueType>> {
    static std::unordered_map<std::string, ValueType> convert(jsi::Runtime& runtime, const jsi::Value& arg) {
        jsi::Object object = arg.asObject(runtime);
        jsi::Array propertyNames = object.getPropertyNames(runtime);
        size_t length = propertyNames.size(runtime);

        std::unordered_map<std::string, ValueType> map;
        for (size_t i = 0; i < length; ++i) {
            auto key = propertyNames.getValueAtIndex(runtime, i).asString(runtime).utf8(runtime);
            jsi::Value value = object.getProperty(runtime, key.c_str());
            map.emplace(key, JSIConverter<ValueType>::convert(runtime, value));
        }
        return map;
    }
};

} // margelo

