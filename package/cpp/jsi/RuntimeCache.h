#pragma once

#include <jsi/jsi.h>

#include <memory>
#include <unordered_map>
#include <unordered_set>
#include <utility>

namespace margelo {

namespace jsi = facebook::jsi;

/**
 * Listener interface that allows for getting notified when a jsi::Runtime
 * instance is destroyed.
 */
struct RuntimeLifecycleListener {
  virtual ~RuntimeLifecycleListener() {}
  virtual void onRuntimeDestroyed(jsi::Runtime*) = 0;
};

/**
 * This class provides an API via static methods for registering and
 * unregistering runtime lifecycle listeners. The listeners can be used to
 * cleanup any data that references a given jsi::Runtime instance before it gets
 * destroyed.
 */
struct RuntimeLifecycleMonitor {
  static void addListener(jsi::Runtime& rt, RuntimeLifecycleListener* listener);
  static void removeListener(jsi::Runtime& rt, RuntimeLifecycleListener* listener);
};

/**
 * Provides a way to keep data specific to a jsi::Runtime instance that gets
 * cleaned up when that runtime is destroyed. This is necessary because JSI does
 * not allow for its associated objects to be retained past the runtime
 * lifetime. If an object (e.g. jsi::Values or jsi::Function instances) is kept
 * after the runtime is torn down, its destructor (once it is destroyed
 * eventually) will result in a crash (JSI objects keep a pointer to memory
 * managed by the runtime, accessing that portion of the memory after runtime is
 * deleted is the root cause of that crash).
 *
 * In order to provide an efficient implementation that does not add an overhead
 * for the cases when only a single runtiome is used, which is the primary
 * usecase, the following assumption has been made: Only for secondary runtimes
 * we track destruction and clean up the store associated with that runtime. For
 * the first runtime we assume that the object holding the store is destroyed
 * prior to the destruction of that runtime.
 *
 * The above assumption makes it work without any overhead when only single
 * runtime is in use. Specifically, we don't perform any additional operations
 * related to tracking runtime lifecycle when only a single runtime is used.
 */
template <typename T> class RuntimeAwareCache : public RuntimeLifecycleListener {

public:
  void onRuntimeDestroyed(jsi::Runtime* rt) override {
    // A runtime has been destroyed, so destroy the related cache.
    _runtimeCaches.erase(rt);
  }

  ~RuntimeAwareCache() {
    for (auto& cache : _runtimeCaches) {
      // remove all `onRuntimeDestroyed` listeners.
      RuntimeLifecycleMonitor::removeListener(*cache.first, this);
    }
  }

  T& get(jsi::Runtime& rt) {
    if (_runtimeCaches.count(&rt) == 0) {
      // This is the first time this Runtime has been accessed.
      // We set up a `onRuntimeDestroyed` listener for it and
      // initialize the cache map.
      RuntimeLifecycleMonitor::addListener(rt, this);

      T cache;
      _runtimeCaches.emplace(&rt, std::move(cache));
    }
    return _runtimeCaches.at(&rt);
  }

private:
  std::unordered_map<jsi::Runtime*, T> _runtimeCaches;
};

} // namespace margelo
