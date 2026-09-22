#include "RNFWorkletRuntimeLock.h"

#if HAS_WORKLETS
#include <worklets/WorkletRuntime/WorkletRuntime.h>
#endif

namespace margelo {

WorkletRuntimeLock::WorkletRuntimeLock(jsi::Runtime& runtime) {
#if HAS_WORKLETS
  try {
    _workletRuntime = worklets::WorkletRuntime::getWeakRuntimeFromJSIRuntime(runtime);
  } catch (...) {
    // Not a worklet runtime (e.g. the main React runtime), nothing to lock.
  }
#endif
}

void WorkletRuntimeLock::runLocked(const std::function<void()>& function) const {
#if HAS_WORKLETS
  if (auto workletRuntime = _workletRuntime.lock()) {
    workletRuntime->runSync([&](jsi::Runtime&) { function(); });
    return;
  }
#endif
  function();
}

} // namespace margelo
