//
// Created by Marc Rousavy on 21.02.24.
//

#pragma once

#include "jsi/HybridObject.h"
#include <functional>

namespace margelo {

class Listener : public HybridObject {
public:
  Listener(Listener&& listener) : HybridObject("Listener"), _remove(std::move(listener._remove)), _isRemoved(listener._isRemoved) {}
  explicit Listener(const std::function<void()>& remove);
  ~Listener();
  void remove();

  void loadHybridMethods() override;

private:
  std::function<void()> _remove;
  bool _isRemoved;
};

} // namespace margelo
