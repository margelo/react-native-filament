//
// Created by Marc Rousavy on 23.02.24.
//

#pragma once

#include "RNFListener.h"
#include "RNFListenerManager.h"
#include <functional>

namespace margelo {

class Choreographer {
public:
  explicit Choreographer() {}
  ~Choreographer() {
    Logger::log("Choreographer", "(MEMORY) Deleting Choreographer... ❌");
  }
  using OnFrameCallback = std::function<void(double timestamp)>;

  std::shared_ptr<Listener> addOnFrameListener(OnFrameCallback onFrameCallback);
  void removeAllListeners();

  virtual void start() = 0;
  virtual void stop() = 0;

protected:
  void onFrame(double timestamp);

private:
  std::shared_ptr<ListenerManager<OnFrameCallback>> _listeners = ListenerManager<OnFrameCallback>::create();

private:
  static constexpr auto TAG = "Choreographer";
};

} // namespace margelo
