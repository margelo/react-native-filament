#pragma once

#include <jsi/jsi.h>
#include <utility>
#include <vector>

namespace margelo {

using namespace facebook;

class Promise {
public:
  Promise(jsi::Runtime& runtime, jsi::Value resolver, jsi::Value rejecter);

  void resolve(jsi::Value&& result);
  void reject(std::string error);

public:
  jsi::Runtime& runtime;

private:
  jsi::Value _resolver;
  jsi::Value _rejecter;

public:
  using RunPromise = std::function<void(jsi::Runtime& runtime, const std::shared_ptr<Promise>& promise)>;
  /**
   Create a new Promise and runs the given `run` function.
   */
  static jsi::Value createPromise(jsi::Runtime& runtime, RunPromise run);
};

} // namespace margelo
