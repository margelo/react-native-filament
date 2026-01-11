//
// Created by Hanno Gödecke on 11.01.26.
// From https://github.com/mrousavy/nitro/blob/afa41bae947ecf738c33569ead42eaf0825cc6d5/packages/react-native-nitro-modules/cpp/core/BoxedHybridObject.hpp
// TODO: should be removable once migrated to nitro modules + RNW supporting nitro HybridObjects
//

#pragma once

#include "RNFHybridObject.h"
#include <jsi/jsi.h>
#include <memory>

namespace margelo {

    using namespace facebook;

/**
 * Represents a `HybridObject` that has been boxed into a `jsi::HostObject`.
 *
 * While `HybridObject`s are runtime agnostic, some threading/worklet libraries do not support copying over objects
 * with `jsi::NativeState` and a prototype chain (which is what a `HybridObject` is), so Nitro offers support for
 * boxing those `HybridObject`s into a type that those libraries support - which is a `jsi::HostObject`.
 *
 * Simply call `unbox()` on this `jsi::HostObject` from the new Runtime/context to get the `HybridObject` again.
 */
    class RNFBoxedHybridObject final : public jsi::HostObject {
    public:
        explicit RNFBoxedHybridObject(const std::shared_ptr<HybridObject>& hybridObject) : _hybridObject(hybridObject) {}

    public:
        jsi::Value get(jsi::Runtime& runtime, const jsi::PropNameID& propName) override;
        std::vector<jsi::PropNameID> getPropertyNames(jsi::Runtime& runtime) override;

    private:
        std::shared_ptr<HybridObject> _hybridObject;
    };

} // namespace margelo::nitro

