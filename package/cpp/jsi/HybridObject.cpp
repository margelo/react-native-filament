//
// Created by Marc Rousavy on 21.02.24.
//

#include "HybridObject.h"

namespace margelo {

HybridObject::~HybridObject() {
    _functionCache.clear();
}



jsi::Value HybridObject::get(facebook::jsi::Runtime& runtime, const facebook::jsi::PropNameID& propName) {
    if (!_didLoadMethods) {
        [[unlikely]];
        // lazy-load all exposed methods
        loadHybridMethods();
        _didLoadMethods = true;
    }

    std::string name = propName.utf8(runtime);
    auto& functionCache = _functionCache[&runtime];

    if (functionCache.count(name) > 0) {
        [[likely]];
        // cache hit
        return jsi::Value(runtime, *functionCache[name]);
    }

    if (_methods.count(name) > 0) {
        // cache miss - create jsi::Function and cache it.
        HybridFunction& hybridFunction = _methods.at(name);
        jsi::Function function = jsi::Function::createFromHostFunction(runtime,
                                                                       jsi::PropNameID::forUtf8(runtime, name),
                                                                       hybridFunction.parameterCount,
                                                                       hybridFunction.function);
        functionCache[name] = std::make_shared<jsi::Function>(std::move(function));
        return jsi::Value(runtime, *functionCache[name]);
    }

    return jsi::HostObject::get(runtime, propName);
}

std::vector<jsi::PropNameID> HybridObject::getPropertyNames(facebook::jsi::Runtime& runtime) {
    if (!_didLoadMethods) {
        [[unlikely]];
        // lazy-load all exposed methods
        loadHybridMethods();
        _didLoadMethods = true;
    }

    std::vector<jsi::PropNameID> result;
    for (const auto& item: _methods) {
        result.push_back(jsi::PropNameID::forUtf8(runtime, item.first));
    }
    return result;
}

template<typename Derived, typename ReturnType, typename... Args>
void HybridObject::registerHybridMethod(std::string name,
                                        ReturnType(Derived::*method)(Args...),
                                        Derived* derivedInstance) {
    if (_methods.count(name) > 0) {
        [[unlikely]];
        throw std::runtime_error("Cannot add Hybrid Method \"" + name + "\" - a method with that name already exists!");
    }

    // TODO(marc): Use std::shared_ptr<T> instead of T* to keep a strong reference of derivedClass.
    auto func = [this, derivedInstance, method](jsi::Runtime &runtime,
                                                const jsi::Value &thisVal,
                                                const jsi::Value *args,
                                                size_t count) -> jsi::Value {
        if constexpr (std::is_same_v<ReturnType, void>) {
            callMethod(derivedInstance, method, runtime, args, std::index_sequence_for<Args...>{});
            return jsi::Value::undefined();
        } else {
            ReturnType result = callMethod(derivedInstance, method, runtime, args, std::index_sequence_for<Args...>{});
            return jsi::Value(result);
        }
    };
    _methods[name] = HybridFunction {
        .function = func,
        .parameterCount = sizeof...(Args)
    };
}

template<typename ClassType, typename ReturnType, typename... Args, size_t... Is>
ReturnType HybridObject::callMethod(ClassType* obj,
                                    ReturnType(ClassType::*method)(Args...),
                                    jsi::Runtime& runtime,
                                    const jsi::Value* args,
                                    std::index_sequence<Is...>) {
    return (obj->*method)(convertArgument<Args>(runtime, args[Is])...);
}

template<typename ArgType>
ArgType HybridObject::convertArgument(jsi::Runtime& runtime, const jsi::Value& arg) {
    if constexpr (std::is_same_v<ArgType, int>) {
        return static_cast<int>(arg.asNumber());
    } else if constexpr (std::is_same_v<ArgType, double>) {
        return arg.asNumber();
    } else if constexpr (std::is_same_v<ArgType, bool>) {
        return arg.asBool();
    } else if constexpr (std::is_same_v<ArgType, std::string>) {
        return arg.asString(runtime).utf8(runtime);
    } else if constexpr (std::is_same_v<ArgType, int64_t>) {
        return arg.asBigInt(runtime).asInt64(runtime);
    } else if constexpr (std::is_same_v<ArgType, uint64_t>) {
        return arg.asBigInt(runtime).getUint64(runtime);
    }
    // TODO: add cases for array, map and other HybridObjects
}

} // margelo