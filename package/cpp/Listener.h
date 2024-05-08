//
// Created by Marc Rousavy on 21.02.24.
//

#pragma once

#include "jsi/HybridObject.h"
#include <functional>
#include <memory>

namespace margelo {

class Listener : public HybridObject {
public:
  using ListenerRemover = std::function<void()>;

public:
  explicit Listener(ListenerRemover&& remove);

  void loadHybridMethods() override;

  static std::shared_ptr<Listener> create(ListenerRemover&& remover);
  ~Listener();
  void remove();

private:
  ListenerRemover _remove;
  bool _isRemoved;
  static constexpr auto TAG = "Listener";
};

} // namespace margelo
