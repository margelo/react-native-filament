//
// Created by Marc Rousavy on 05.03.24.
//

#pragma once

#include <stddef.h>
#include <stdint.h>

namespace margelo {

class ManagedBuffer {
public:
  virtual ~ManagedBuffer() {}
  virtual const uint8_t* getData() const = 0;
  virtual size_t getSize() const = 0;
    // Note: in general we don't want to manually release anything.
    // However, the reference to the Buffers is managed on the JS side and Hades seldomly
    // GCs these buffers as it can't see their true size. Thus we need a mechanism to
    // manually release the memory of the buffers once we have loaded an asset.
  virtual void release() {}
};

} // namespace margelo
