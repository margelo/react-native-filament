//
// Created by Marc Rousavy on 21.02.24.
//

#pragma once

#include <jsi/jsi.h>
#include <unordered_map>
#include "HybridObject.h"
#include <type_traits>
#include <memory>

namespace margelo {

using namespace facebook;

template<typename ArgType, typename Enable = void>
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
    static std::vector<ElementType> fromJSI(jsi::Runtime& runtime, const jsi::Value& arg) {
        jsi::Array array = arg.asObject(runtime).asArray(runtime);
        size_t length = array.size(runtime);

        std::vector<ElementType> vector;
        vector.reserve(length);
        for (size_t i = 0; i < length; ++i) {
            jsi::Value elementValue = array.getValueAtIndex(runtime, i);
            vector.emplace_back(JSIConverter<ElementType>::fromJSI(runtime, elementValue));
        }
        return vector;
    }
};

template<typename ValueType>
struct JSIConverter<std::unordered_map<std::string, ValueType>> {
    static std::unordered_map<std::string, ValueType> fromJSI(jsi::Runtime& runtime, const jsi::Value& arg) {
        jsi::Object object = arg.asObject(runtime);
        jsi::Array propertyNames = object.getPropertyNames(runtime);
        size_t length = propertyNames.size(runtime);

        std::unordered_map<std::string, ValueType> map;
        for (size_t i = 0; i < length; ++i) {
            auto key = propertyNames.getValueAtIndex(runtime, i).asString(runtime).utf8(runtime);
            jsi::Value value = object.getProperty(runtime, key.c_str());
            map.emplace(key, JSIConverter<ValueType>::fromJSI(runtime, value));
        }
        return map;
    }
};

template<typename T>
struct is_shared_ptr_to_host_object : std::false_type {};

template<typename T>
struct is_shared_ptr_to_host_object<std::shared_ptr<T>> : std::is_base_of<jsi::HostObject, T> {};

template<typename T>
struct JSIConverter<T, std::enable_if_t<is_shared_ptr_to_host_object<T>::value>> {
    static T fromJSI(jsi::Runtime& runtime, const jsi::Value& arg) {
        return arg.asObject(runtime).asHostObject<typename T::element_type>(runtime);
    }
};

} // margelo

