//
// Created by Marc Rousavy on 21.02.24.
//

#include "HybridObject.h"

namespace margelo {

HybridObject::~HybridObject() {
    _functionCache.clear();
}



jsi::Value HybridObject::get(facebook::jsi::Runtime& runtime, const facebook::jsi::PropNameID& propName) {
    std::string name = propName.utf8(runtime);
    auto& functionCache = _functionCache[&runtime];

    if (functionCache.count(name) > 0) {
        // cache hit
        return jsi::Value(runtime, *functionCache[name]);
    }

    if (_methods.count(name) > 0) {
        // cache miss - create jsi::Function and cache it.
        jsi::HostFunctionType hostFunction = _methods.at(name);
        jsi::Function function = jsi::Function::createFromHostFunction(runtime,
                                                                   jsi::PropNameID::forUtf8(runtime, name),
            // TODO(marc): Also add parameter count here
                                                                   1,
                                                                   hostFunction);
        functionCache[name] = std::make_shared<jsi::Function>(std::move(function));
        return jsi::Value(runtime, *functionCache[name]);
    }

    return jsi::HostObject::get(runtime, propName);
}

std::vector<jsi::PropNameID> HybridObject::getPropertyNames(facebook::jsi::Runtime& runtime) {
    std::vector<jsi::PropNameID> result;
    for (const auto& item: _methods) {
        result.push_back(jsi::PropNameID::forUtf8(runtime, item.first));
    }
    return result;
}

} // margelo