//
// Created by Marc Rousavy on 05.03.24.
//

#pragma once

#include "ManagedBuffer.h"
#include <fbjni/ByteBuffer.h>
#include <fbjni/fbjni.h>

namespace margelo {

using namespace facebook;

class AndroidManagedBuffer : public ManagedBuffer {
public:
  explicit AndroidManagedBuffer(const jni::alias_ref<jni::JByteBuffer>& buffer) : _buffer(jni::make_global(buffer)) {
    _buffer->rewind();
  }

  ~AndroidManagedBuffer() override {
    jni::ThreadScope::WithClassLoader([&] { _buffer.reset(); });
  }

  const uint8_t* getData() const override {
    return _buffer->getDirectBytes();
  }

  size_t getSize() const override {
    return _buffer->getDirectSize();
  }

private:
  jni::global_ref<jni::JByteBuffer> _buffer;
};

} // namespace margelo
