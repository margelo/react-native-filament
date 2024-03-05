//
// Created by Marc Rousavy on 21.02.24.
//

#pragma once

#include "jsi/HybridObject.h"
#include <functional>

namespace margelo {

class Listener : public HybridObject {
public:
  Listener(Listener&& listener) : _remove(std::move(listener._remove)), _isRemoved(listener._isRemoved) {}
  explicit Listener(std::function<void()> remove);
  ~Listener();
  void remove();

  void loadHybridMethods() override;

private:
  const char* getName() override { return "Listener"; }

private:
  std::function<void()> _remove;
  bool _isRemoved;
};

} // namespace margelo
