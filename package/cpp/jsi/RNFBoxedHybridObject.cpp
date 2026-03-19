//
//  BoxedHybridObject.cpp
//  NitroModules
//
//  Created by Marc Rousavy on 17.09.24.
//

#include "RNFBoxedHybridObject.h"

namespace margelo {

    std::vector<jsi::PropNameID> RNFBoxedHybridObject::getPropertyNames(facebook::jsi::Runtime& runtime) {
        return jsi::PropNameID::names(runtime, "unbox");
    }

    jsi::Value RNFBoxedHybridObject::get(jsi::Runtime& runtime, const jsi::PropNameID& propName) {
        std::string name = propName.utf8(runtime);

        if (name == "unbox") {
            return jsi::Function::createFromHostFunction(
                    runtime, jsi::PropNameID::forUtf8(runtime, "unbox"), 0,
                    [hybridObject = _hybridObject](jsi::Runtime& runtime, const jsi::Value&, const jsi::Value*, size_t) -> jsi::Value {
                        return JSIConverter<std::shared_ptr<HybridObject>>::toJSI(runtime, hybridObject);
//                        return jsi::Object::createFromHostObject(runtime, hybridObject);
                    });
        }

        return jsi::Value::undefined();
    }

} // namespace margelo::nitro
