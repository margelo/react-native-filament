//
// Created by Marc Rousavy on 21.02.24.
//

#pragma once

#if __has_include(<NitroModules/HybridObject.hpp>)
#include <NitroModules/HybridObject.hpp>
#else
#error NitroModules cannot be found! Are you sure you installed NitroModules properly?
#endif
#include <functional>
#include <memory>

namespace margelo {

class Listener : public nitro::HybridObject {
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
