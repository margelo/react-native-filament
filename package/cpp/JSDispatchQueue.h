//
// Created by Marc Rousavy on 05.03.24.
//

#pragma once

#include <jsi/jsi.h>
#include <ReactCommon/CallInvoker.h>
#include <functional>

namespace margelo {

using namespace facebook;

class JSDispatchQueue {
using Callback = std::function<void()>;

 public:
  explicit JSDispatchQueue(std::shared_ptr<react::CallInvoker> callInvoker) {
    _runOnJSAsync = [callInvoker] (Callback callback) {
      callInvoker->invokeAsync(std::move(callback));
    };
    _runOnJSSync = [callInvoker] (Callback callback) {
      callInvoker->invokeSync(std::move(callback));
    };
  }

  void runOnJS(const Callback& function) { _runOnJSAsync(function); }
  void runOnJSAndWait(const Callback& function) { _runOnJSSync(function); }

 private:
  std::function<void(Callback)> _runOnJSAsync;
  std::function<void(Callback)> _runOnJSSync;
};


} // namespace margelo