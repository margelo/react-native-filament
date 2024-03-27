//
// Created by Marc Rousavy on 27.03.24.
//

#pragma once

#include "Dispatcher.h"
#include <react-native-worklets-core/WKTJsiWorkletContext.h>

namespace margelo {

using namespace facebook;
using namespace RNWorklet;

/**
 * A Dispatcher that uses RNWorklet::JsiWorkletContext for it's implementation
 */
class WorkletContextDispatcher: public Dispatcher {

 public:
  explicit WorkletContextDispatcher(const std::shared_ptr<JsiWorkletContext>& context): _workletContext(context) {}

  void runAsync(std::function<void ()> &&function) override {
    _workletContext->invokeOnWorkletThread([function = std::move(function)](JsiWorkletContext*, jsi::Runtime&) {
      function();
    });
  }

  void runSync(std::function<void ()> &&function) override {
    _mutex.lock();
    runAsync([this, function = std::move(function)]() {
      function();
      _mutex.unlock();
    });
    _mutex.lock();
    _mutex.unlock();
  }

 private:
  std::shared_ptr<JsiWorkletContext> _workletContext;
  std::mutex _mutex;
};

}