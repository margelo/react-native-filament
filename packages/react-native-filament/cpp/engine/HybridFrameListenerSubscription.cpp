#include "HybridFrameListenerSubscription.hpp"

namespace margelo::nitro::filament {

void HybridFrameListenerSubscription::remove() {
  std::shared_ptr<FrameListener> listener = listener_.lock();
  std::shared_ptr<EngineCore> engine = engine_.lock();
  if (listener == nullptr || engine == nullptr || listener->removed.exchange(true)) {
    return;
  }
  engine->thread().post({.run = [engine, weak = listener_] {
    if (std::shared_ptr<FrameListener> strong = weak.lock()) {
      engine->removeFrameListener(strong);
    }
  }});
}

} // namespace margelo::nitro::filament
