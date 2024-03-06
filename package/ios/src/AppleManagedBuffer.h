//
//  AppleManagedBuffer.h
//  react-native-filament
//
//  Created by Marc Rousavy on 05.03.24.
//

#pragma once

#include "ManagedBuffer.h"
#include <Foundation/Foundation.h>

namespace margelo {

class AppleManagedBuffer : public ManagedBuffer {
public:
  explicit AppleManagedBuffer(NSData* data) : _data(data) {}

  const uint8_t* getData() const override {
    return static_cast<const uint8_t*>(_data.bytes);
  }

  size_t getSize() const override {
    return _data.length;
  }

private:
  NSData* _data;
};

} // namespace margelo
