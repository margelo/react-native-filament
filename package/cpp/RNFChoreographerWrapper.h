//
// Created by Hanno Gödecke on 02.05.24.
//

#pragma once

#include "HybridChoreographerSpec.hpp"
#include "RNFChoreographer.h"
#include "jsi/RNFHybridPointerHolder.h"
#include "jsi/RNFRuntimeCache.h"

namespace margelo {

using namespace nitro::RNF;

using RenderCallback = std::function<void(FrameInfo)>;

class ChoreographerWrapper : public HybridChoreographerSpec, public HybridPointerHolder<Choreographer>, public RuntimeLifecycleListener {
public:
  explicit ChoreographerWrapper(std::shared_ptr<Choreographer> choreographer) : HybridChoreographerSpec(), HybridPointerHolder(HybridChoreographerSpec::TAG, choreographer) {}
  ~ChoreographerWrapper() override;

  void loadHybridMethods() override;

protected:
  std::shared_ptr<Choreographer> getChoreographer();
  friend class FilamentView; // Allow filament view to access protected method

private: // Exposed JS API
  void start() override;
  void stop() override;
  std::shared_ptr<Listener> addFrameCallbackListener(RenderCallback onFrameCallback);
  void release() override;

private: // Internal
  void stopAndRemoveListeners();
  void onRuntimeDestroyed(jsi::Runtime*) override;
  FrameInfo createFrameInfo(double timestamp);

private:
  std::mutex _mutex;
  double _startTime = 0;
  double _lastFrameTime = 0;
};
} // namespace margelo
