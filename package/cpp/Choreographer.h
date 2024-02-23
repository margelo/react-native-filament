//
// Created by Marc Rousavy on 23.02.24.
//

#pragma once

#include "Listener.h"
#include "jsi/HybridObject.h"
#include <functional>

namespace margelo {

class Choreographer : public HybridObject {
public:
  using OnFrameCallback = std::function<void(double timestamp)>;

  std::shared_ptr<Listener> addOnFrameListener(OnFrameCallback onFrameCallback);

  virtual void start() = 0;
  virtual void stop() = 0;

protected:
  void onFrame(double timestamp);

  void loadHybridMethods() override;

private:
  std::vector<OnFrameCallback> _callbacks;
};

} // namespace margelo
