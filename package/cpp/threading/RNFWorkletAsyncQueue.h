//
// Created for the react-native-worklets migration.
//

#pragma once

#include "RNFDispatcher.h"
#include <memory>

#if HAS_WORKLETS
#include <worklets/RunLoop/AsyncQueue.h>
#include <worklets/RunLoop/AsyncQueueImpl.h>
#include <worklets/Tools/UIScheduler.h>
#endif

namespace margelo {

#if HAS_WORKLETS
/**
 * Hands react-native-worklets jobs to Filament's render thread.
 *
 * react-native-worklets finds the queue of a custom runtime with a dynamic_cast on the object it
 * gets from JS. On Android that cast compares type_info pointers, and the type_info of
 * worklets::AsyncQueue is a weak symbol that every library gets its own copy of. Which copy a
 * library binds to depends on the dlopen order, so a subclass of AsyncQueue defined here fails
 * the cast whenever libworklets.so loads before this library (Reanimated makes that the common
 * case). AsyncQueueUI lives inside libworklets.so, so its type chain always matches: we use it
 * with a scheduler that forwards to the render thread instead of subclassing AsyncQueue.
 */
class RenderThreadScheduler : public worklets::UIScheduler {
public:
  explicit RenderThreadScheduler(std::shared_ptr<Dispatcher> dispatcher) : _dispatcher(std::move(dispatcher)) {}

  void scheduleOnUI(std::function<void()> job) override {
    _dispatcher->runAsync(std::move(job));
  }

protected:
  // Only react-native-worklets' own UI scheduler is asked this; the render thread is never "the UI thread".
  bool queryIsOnUIThread() const override {
    return false;
  }

private:
  std::shared_ptr<Dispatcher> _dispatcher;
};

inline std::shared_ptr<worklets::AsyncQueue> createRenderThreadAsyncQueue(std::shared_ptr<Dispatcher> dispatcher) {
  return std::make_shared<worklets::AsyncQueueUI>(std::make_shared<RenderThreadScheduler>(std::move(dispatcher)));
}
#endif // HAS_WORKLETS

} // namespace margelo
