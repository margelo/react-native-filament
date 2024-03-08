//
// Created by Marc Rousavy on 23.02.24.
//

#pragma once

#include "Listener.h"
#include "ListenerManager.h"
#include <functional>

namespace margelo {

class Choreographer {
public:
  explicit Choreographer() {}
  using OnFrameCallback = std::function<void(double timestamp)>;

  std::shared_ptr<Listener> addOnFrameListener(OnFrameCallback onFrameCallback);

  virtual void start() = 0;
  virtual void stop() = 0;

protected:
  void onFrame(double timestamp);

private:
  ListenerManager<OnFrameCallback> _listeners;
};

} // namespace margelo
