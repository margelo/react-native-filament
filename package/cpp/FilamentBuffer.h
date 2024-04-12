#pragma once

#include "ManagedBuffer.h"
#include "jsi/HybridObject.h"

namespace margelo {

class FilamentBuffer : public HybridObject {
public:
  explicit FilamentBuffer(const std::shared_ptr<ManagedBuffer>& buffer) : HybridObject("FilamentBuffer"), _buffer(buffer) {}

  void loadHybridMethods() override {
    registerHybridMethod("release", &FilamentBuffer::release, this);
  }

  const std::shared_ptr<ManagedBuffer>& getBuffer() {
    return _buffer;
  }

  void release() {
    Logger::log("FilamentBuffer", "Manually releasing buffer of size %fmb", static_cast<float>(_buffer->getSize()) / 1024 / 1024);
    _buffer->release();
  }

private:
  std::shared_ptr<ManagedBuffer> _buffer;
};

} // namespace margelo
