//
// Created for the react-native-worklets migration.
//

#pragma once

#include <functional>
#include <jsi/jsi.h>
#include <memory>
#include <optional>
#include <type_traits>

namespace worklets {
class WorkletRuntime;
}

namespace margelo {

using namespace facebook;

/**
 * react-native-worklets guards every worklet runtime with a mutex and takes it from other threads
 * (hot reload, custom serializables, shared value reads). Native code that calls into a worklet
 * runtime from Filament's render thread has to hold the same mutex, otherwise Hermes gets entered
 * from two threads at once.
 *
 * For runtimes that are not worklet runtimes (the main React runtime) `run` just calls the function.
 */
class WorkletRuntimeLock {
public:
  explicit WorkletRuntimeLock(jsi::Runtime& runtime);

  template <typename F> auto run(F&& function) const -> std::invoke_result_t<F> {
    using Result = std::invoke_result_t<F>;
    if constexpr (std::is_void_v<Result>) {
      runLocked([&]() { function(); });
    } else {
      std::optional<Result> result;
      runLocked([&]() { result.emplace(function()); });
      return std::move(*result);
    }
  }

private:
  void runLocked(const std::function<void()>& function) const;

private:
  std::weak_ptr<worklets::WorkletRuntime> _workletRuntime;
};

} // namespace margelo
