//
// Created by Marc Rousavy on 16.04.24.
//

#pragma once

#include <memory>
#include <mutex>
#include "HybridObject.h"
#include "Logger.h"

namespace margelo {

using namespace facebook;

template <typename T>
class PointerHolder: public HybridObject {
 protected:
  PointerHolder() = delete;
  PointerHolder(const char* name, std::shared_ptr<T> pointer): HybridObject(name), _name(name), _pointer(pointer) { }
  PointerHolder(const char* name, T&& value): PointerHolder(name, std::make_shared<T>(std::move(value))) { }
  ~PointerHolder() {
    Logger::log(TAG, "Automatically releasing %s... (~PointerHolder())", _name);
  }

protected:
  void release() {
    std::unique_lock lock(_mutex);

    if (_pointer == nullptr) {
      throw std::runtime_error("Pointer " + _name + " has already been manually released!");
    }
    Logger::log(TAG, "Manually releasing %s... (PointerHolder::release())", _name);
    _pointer = nullptr;
  }

  std::shared_ptr<T> pointee() {
    std::unique_lock lock(_mutex);

    if (_pointer == nullptr) {
      throw std::runtime_error("Pointer " + _name + " has already been manually released!");
    }
    return _pointer;
  }

private:
  std::string _name;
  std::shared_ptr<T> _pointer;
  std::mutex _mutex;
  static constexpr auto TAG = "PointerHolder";
};


} // namespace margelo
