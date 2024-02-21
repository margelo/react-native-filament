//
// Created by Marc Rousavy on 21.02.24.
//

#pragma once

#include <functional>

namespace margelo {

class Listener {
public:
  explicit Listener(std::function<void()> remove);
  ~Listener();
  void remove();

private:
  std::function<void()> _remove;
  bool _isRemoved;
};

} // namespace margelo
