//
// Created by Marc Rousavy on 21.02.24.
//

#pragma once

#include "HybridListenerSpec.hpp"
#include <functional>
#include <memory>

namespace margelo {

class Listener : public nitro::RNF::HybridListenerSpec {
public:
  using ListenerRemover = std::function<void()>;

public:
  explicit Listener(ListenerRemover&& remove);

  static std::shared_ptr<Listener> create(ListenerRemover&& remover);
  ~Listener();
  void remove() override;

private:
  ListenerRemover _remove;
  bool _isRemoved;
  static constexpr auto TAG = "Listener";
};

} // namespace margelo
