//
// Created by Hanno Gödecke on 02.05.24.
//

#pragma once

#include "Choreographer.h"
#include "jsi/PointerHolder.h"
#include "jsi/RuntimeCache.h"

namespace margelo {

template <typename R, typename... Args> class ShareableJsiFunction {
public:
  ShareableJsiFunction(std::function<R(Args...)>&& function, jsi::Runtime* runtime)
      : _function(std::make_unique<std::function<R(Args...)>>(std::move(function))), _runtime(runtime) {}
  ~ShareableJsiFunction() {
    if (!RNFWorkletRuntimeRegistry::isRuntimeAlive(_runtime)) {
      // This will not delete the underlying pointer.
      // When the runtime is destroyed we can't call the jsi::Value's destructor,
      // as we would run into a crash (as the runtime is already gone).
      _function.release();
    }
  }

  R operator()(Args... args) const {
    (*_function)(std::forward<Args>(args)...);
  }

private:
  std::unique_ptr<std::function<R(Args...)>> _function;
  jsi::Runtime* _runtime;
};

using FrameInfo = std::unordered_map<std::string, double>;
using RenderCallback = std::function<void(FrameInfo)>;

class ChoreographerWrapper : public PointerHolder<Choreographer>, public RuntimeLifecycleListener {
public:
  explicit ChoreographerWrapper(std::shared_ptr<Choreographer> choreographer) : PointerHolder(TAG, choreographer) {}

  void loadHybridMethods() override;

protected:
  std::shared_ptr<Choreographer> getChoreographer();
  friend class FilamentView; // Allow filament view to access protected method

private: // Exposed JS API
  void start();
  void stop();
  std::shared_ptr<Listener> addFrameCallbackListener(RenderCallback onFrameCallback);
  void release() override;

private: // Internal
  void cleanup();
  void onRuntimeDestroyed(jsi::Runtime*) override;
  void renderCallback(double timestamp);

private:
  std::mutex _mutex;
  double _startTime = 0;
  double _lastFrameTime = 0;
  std::shared_ptr<Listener> _choreographerListener = nullptr;
  std::shared_ptr<ListenerManager<RenderCallback>> _renderCallbackListeners = ListenerManager<RenderCallback>::create();

private:
  static constexpr auto TAG = "ChoreographerWrapper";
};
} // namespace margelo
