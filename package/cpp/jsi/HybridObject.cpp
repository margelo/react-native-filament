//
// Created by Marc Rousavy on 21.02.24.
//

#include "HybridObject.h"
#include "JSIConverter.h"
#include "Logger.h"

namespace margelo {

#if DEBUG
static std::unordered_map<const char*, int> _instanceIds;

static int getId(const char* name) {
  if (_instanceIds.find(name) == _instanceIds.end()) {
    _instanceIds.insert({name, 1});
  }
  auto iterator = _instanceIds.find(name);
  return iterator->second++;
}
#endif

HybridObject::HybridObject(const char* name) : _name(name) {
#if DEBUG
  _instanceId = getId(name);
  Logger::log(TAG, "(MEMORY) Creating %s (#%i)... ✅", _name, _instanceId);
#endif
}

HybridObject::~HybridObject() {
#if DEBUG
  Logger::log(TAG, "(MEMORY) Deleting %s (#%i)... ❌", _name, _instanceId);
#endif
  _functionCache.clear();
}

std::vector<jsi::PropNameID> HybridObject::getPropertyNames(facebook::jsi::Runtime& runtime) {
  std::unique_lock lock(_mutex);
  ensureInitialized();

  std::vector<jsi::PropNameID> result;
  size_t totalSize = _methods.size() + _getters.size() + _setters.size();
  result.reserve(totalSize);

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

jsi::Value HybridObject::get(facebook::jsi::Runtime& runtime, const facebook::jsi::PropNameID& propName) {
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

void HybridObject::set(facebook::jsi::Runtime& runtime, const facebook::jsi::PropNameID& propName, const facebook::jsi::Value& value) {
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

void HybridObject::ensureInitialized() {
  if (!_didLoadMethods) {
    [[unlikely]];
    // lazy-load all exposed methods
    loadHybridMethods();
    _didLoadMethods = true;
  }
}

} // namespace margelo
