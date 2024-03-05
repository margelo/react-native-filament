//
// Created by Marc Rousavy on 05.03.24.
//

#pragma once

#include <stddef.h>
#include <stdint.h>

namespace margelo {

class ManagedBuffer {
public:
  virtual ~ManagedBuffer() = 0;
  virtual const uint8_t* getData() const = 0;
  virtual size_t getSize() const = 0;
};

} // namespace margelo
