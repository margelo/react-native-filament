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
public:
    struct HybridFunction {
        jsi::HostFunctionType function;
        size_t parameterCount;
    };

public:
    ~HybridObject();

    jsi::Value get(facebook::jsi::Runtime& runtime, const facebook::jsi::PropNameID& propName) override;
    std::vector<jsi::PropNameID> getPropertyNames(facebook::jsi::Runtime& runtime) override;

    /**
     * Loads all native methods of this `HybridObject` to be exposed to JavaScript.
     * Example:
     *
     * ```cpp
     * int User::getAge() {
     *   return 23;
     * }
     *
     * void User::loadHybridMethods() {
     *   registerHybridMethod("getAge", &User::getAge, this);
     * }
     * ```
     */
    virtual void loadHybridMethods() = 0;

private:
    bool _didLoadMethods = false;
    std::unordered_map<std::string, HybridFunction> _methods;
    std::unordered_map<jsi::Runtime*, std::unordered_map<std::string, std::shared_ptr<jsi::Function>>> _functionCache;

private:
    template<typename ArgType>
    ArgType convertArgument(jsi::Runtime& runtime, const jsi::Value& arg);

    template<typename ClassType, typename ReturnType, typename... Args, size_t... Is>
    ReturnType callMethod(ClassType* obj,
                          ReturnType(ClassType::*method)(Args...),
                          jsi::Runtime& runtime,
                          const jsi::Value* args,
                          std::index_sequence<Is...>);
protected:
    template<typename Derived, typename ReturnType, typename... Args>
    void registerHybridMethod(std::string name, ReturnType(Derived::*method)(Args...), Derived* derivedInstance);
};

} // margelo

