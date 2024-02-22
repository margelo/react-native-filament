//
// Created by Marc Rousavy on 21.02.24.
//

#pragma once

#include "JSIConverter.h"
#include <functional>
#include <jsi/jsi.h>
#include <memory>
#include <mutex>
#include <unordered_map>

namespace margelo {

using namespace facebook;

template <typename Derived> class HybridObject : public jsi::HostObject, std::enable_shared_from_this<Derived> {
public:
  struct HybridFunction {
    jsi::HostFunctionType function;
    size_t parameterCount;
  };

public:
  void set(facebook::jsi::Runtime& runtime, const facebook::jsi::PropNameID& propName, const facebook::jsi::Value& value) override {
    std::unique_lock lock(_mutex);
    ensureInitialized();

    std::string name = propName.utf8(runtime);

    if (_setters.count(name) > 0) {
      // Call setter
      _setters[name](runtime, jsi::Value::undefined(), &value, 1);
      return;
    }

    HostObject::set(runtime, propName, value);
  }
  jsi::Value get(facebook::jsi::Runtime& runtime, const facebook::jsi::PropNameID& propName) override {
    std::unique_lock lock(_mutex);
    ensureInitialized();

    std::string name = propName.utf8(runtime);
    auto& functionCache = _functionCache[&runtime];

    if (_getters.count(name) > 0) {
      // it's a property getter
      return _getters[name](runtime, jsi::Value::undefined(), nullptr, 0);
    }

    if (functionCache.count(name) > 0) {
      [[likely]];
      // cache hit
      return jsi::Value(runtime, *functionCache[name]);
    }

    if (_methods.count(name) > 0) {
      // cache miss - create jsi::Function and cache it.
      HybridFunction& hybridFunction = _methods.at(name);
      jsi::Function function = jsi::Function::createFromHostFunction(runtime, jsi::PropNameID::forUtf8(runtime, name),
                                                                     hybridFunction.parameterCount, hybridFunction.function);
      functionCache[name] = std::make_shared<jsi::Function>(std::move(function));
      return jsi::Value(runtime, *functionCache[name]);
    }

    return jsi::HostObject::get(runtime, propName);
  }
  std::vector<jsi::PropNameID> getPropertyNames(facebook::jsi::Runtime& runtime) override {
    std::unique_lock lock(_mutex);
    ensureInitialized();

    std::vector<jsi::PropNameID> result;
    for (const auto& item : _methods) {
      result.push_back(jsi::PropNameID::forUtf8(runtime, item.first));
    }
    for (const auto& item : _getters) {
      result.push_back(jsi::PropNameID::forUtf8(runtime, item.first));
    }
    for (const auto& item : _setters) {
      result.push_back(jsi::PropNameID::forUtf8(runtime, item.first));
    }
    return result;
  }

  /**
   * Get the `std::shared_ptr` instance of this HybridObject.
   * The HybridObject must be managed inside a `shared_ptr` already, otherwise this will fail.
   */
  std::shared_ptr<Derived> shared() {
    return std::enable_shared_from_this<Derived>::shared_from_this();
  }

protected:
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
  std::mutex _mutex;
  std::unordered_map<std::string, HybridFunction> _methods;
  std::unordered_map<std::string, jsi::HostFunctionType> _getters;
  std::unordered_map<std::string, jsi::HostFunctionType> _setters;
  std::unordered_map<jsi::Runtime*, std::unordered_map<std::string, std::shared_ptr<jsi::Function>>> _functionCache;

private:
  inline void ensureInitialized() {
    if (!_didLoadMethods) {
      [[unlikely]];
      // lazy-load all exposed methods
      loadHybridMethods();
      _didLoadMethods = true;
    }
  }

private:
  std::string getName() {
    return typeid(Derived).name();
  }

  template <typename ReturnType, typename... Args, size_t... Is>
  inline jsi::Value callMethod(Derived* obj, ReturnType (Derived::*method)(Args...), jsi::Runtime& runtime, const jsi::Value* args,
                               std::index_sequence<Is...>) {
    if constexpr (std::is_same_v<ReturnType, void>) {
      // It's a void method.
      (obj->*method)(JSIConverter<Args>::fromJSI(runtime, args[Is])...);
      return jsi::Value::undefined();
    } else {
      // It's returning some C++ type, we need to convert that to a JSI value now.
      ReturnType result = (obj->*method)(JSIConverter<Args>::fromJSI(runtime, args[Is])...);
      return JSIConverter<ReturnType>::toJSI(runtime, result);
    }
  }

  template <typename ReturnType, typename... Args>
  jsi::HostFunctionType createHybridMethod(ReturnType (Derived::*method)(Args...), Derived* derivedInstance) {
    return [this, derivedInstance, method](jsi::Runtime& runtime, const jsi::Value& thisVal, const jsi::Value* args,
                                           size_t count) -> jsi::Value {
      if (count != sizeof...(Args)) {
        [[unlikely]];
        throw jsi::JSError(runtime, getName() + ": Expected " + std::to_string(sizeof...(Args)) + " arguments, but received " +
                                        std::to_string(count) + "!");
      }
      // Call the actual method with JSI values as arguments and return a JSI value again.
      // Internally, this method converts the JSI values to C++ values.
      return callMethod(derivedInstance, method, runtime, args, std::index_sequence_for<Args...>{});
    };
  }

protected:
  template <typename ReturnType, typename... Args>
  void registerHybridMethod(std::string name, ReturnType (Derived::*method)(Args...), Derived* derivedInstance) {
    if (_getters.count(name) > 0 || _setters.count(name) > 0) {
      [[unlikely]];
      throw std::runtime_error(getName() + ": Cannot add Hybrid Method \"" + name + "\" - a property with that name already exists!");
    }
    if (_methods.count(name) > 0) {
      throw std::runtime_error(getName() + ": Cannot add Hybrid Method \"" + name + "\" - a method with that name already exists!");
    }

    _methods[name] = HybridFunction{.function = createHybridMethod(method, derivedInstance), .parameterCount = sizeof...(Args)};
  }

  template <typename ReturnType> void registerHybridGetter(std::string name, ReturnType (Derived::*method)(), Derived* derivedInstance) {
    if (_getters.count(name) > 0) {
      [[unlikely]];
      throw std::runtime_error(getName() + ": Cannot add Hybrid Property Getter \"" + name +
                               "\" - a getter with that name already exists!");
    }
    if (_methods.count(name) > 0) {
      [[unlikely]];
      throw std::runtime_error(getName() + ": Cannot add Hybrid Property Getter \"" + name +
                               "\" - a method with that name already exists!");
    }

    _getters[name] = createHybridMethod(method, derivedInstance);
  }

  template <typename ValueType> void registerHybridSetter(std::string name, void (Derived::*method)(ValueType), Derived* derivedInstance) {
    if (_setters.count(name) > 0) {
      [[unlikely]];
      throw std::runtime_error(getName() + ": Cannot add Hybrid Property Setter \"" + name +
                               "\" - a setter with that name already exists!");
    }
    if (_methods.count(name) > 0) {
      [[unlikely]];
      throw std::runtime_error(getName() + ": Cannot add Hybrid Property Setter \"" + name +
                               "\" - a method with that name already exists!");
    }

    _setters[name] = createHybridMethod(method, derivedInstance);
  }
};

} // namespace margelo
