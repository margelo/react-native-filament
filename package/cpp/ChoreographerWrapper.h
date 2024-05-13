//
// Created by Hanno Gödecke on 02.05.24.
//

#pragma once

#include "Choreographer.h"
#include "jsi/PointerHolder.h"
#include "jsi/RuntimeCache.h"

namespace margelo {

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
  // TODO: refactor to addOnFrameListener and support multiple listeners, expose Listener as JS object
  void setFrameCallback(RenderCallback onFrameCallback);
  void release() override;

private: // Internal
  void cleanup();
  void onRuntimeDestroyed(jsi::Runtime*) override;
  void renderCallback(double timestamp);

private:
  std::mutex _mutex;
  double _startTime = 0;
  double _lastFrameTime = 0;
  std::shared_ptr<Listener> _listener = nullptr;
  std::unique_ptr<RenderCallback> _renderCallback = nullptr;

private:
  static constexpr auto TAG = "ChoreographerWrapper";
};
} // namespace margelo
