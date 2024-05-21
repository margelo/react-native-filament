//
// Created by Marc Rousavy on 05.03.24.
//

#pragma once

#include "RNFManagedBuffer.h"
#include <fbjni/ByteBuffer.h>
#include <fbjni/fbjni.h>

namespace margelo {

using namespace facebook;

class AndroidManagedBuffer : public ManagedBuffer {
public:
  explicit AndroidManagedBuffer(const jni::alias_ref<jni::JByteBuffer> &buffer)
      : _buffer(jni::make_global(buffer)) {
    _buffer->rewind();
  }

  ~AndroidManagedBuffer() override { releaseBuffer(); }

  const uint8_t *getData() const override { return _buffer->getDirectBytes(); }

  size_t getSize() const override { return _buffer->getDirectSize(); }

  void release() override { releaseBuffer(); }

  void releaseBuffer() {
    jni::ThreadScope::WithClassLoader([&] { _buffer.reset(); });
  }

private:
  jni::global_ref<jni::JByteBuffer> _buffer;
};

} // namespace margelo
