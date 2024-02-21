//
// Created by Marc Rousavy on 21.02.24.
//

#pragma once

#include <functional>
#include <memory>
#include <unordered_map>
#include <jsi/jsi.h>

#include "JsiTypeTraits.h"

namespace margelo {

using namespace facebook;

class HybridObject: public jsi::HostObject {
    struct HybridFunction {
        jsi::HostFunctionType function;
        size_t parameterCount;
    };

private:
    std::unordered_map<std::string, HybridFunction> _methods;
    std::unordered_map<jsi::Runtime*, std::unordered_map<std::string, std::shared_ptr<jsi::Function>>> _functionCache;

public:
    ~HybridObject();

    jsi::Value get(facebook::jsi::Runtime& runtime, const facebook::jsi::PropNameID& propName) override;
    std::vector<jsi::PropNameID> getPropertyNames(facebook::jsi::Runtime& runtime) override;

    virtual void loadMethods() = 0;


private:
    template<typename ArgType>
    ArgType convertArgument(jsi::Runtime& runtime, const jsi::Value& arg) {
        if constexpr (std::is_same_v<ArgType, int>) {
            return static_cast<int>(arg.asNumber());
        } else if constexpr (std::is_same_v<ArgType, double>) {
            return arg.asNumber();
        } else if constexpr (std::is_same_v<ArgType, bool>) {
            return arg.asBool();
        } else if constexpr (std::is_same_v<ArgType, std::string>) {
            return arg.asString(runtime).utf8(runtime);
        }

    }

    template<typename ClassType, typename ReturnType, typename... Args, size_t... Is>
    ReturnType callMethod(ClassType* obj, ReturnType(ClassType::*method)(Args...), jsi::Runtime& runtime, const jsi::Value* args, std::index_sequence<Is...>) {
        return (obj->*method)(convertArgument<Args>(runtime, args[Is])...);
    }



protected:
    template<typename Derived, typename ReturnType, typename... Args>
    void registerHybridMethod(std::string name, ReturnType(Derived::*method)(Args...), Derived* derivedInstance) {
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
    }
};

} // margelo

