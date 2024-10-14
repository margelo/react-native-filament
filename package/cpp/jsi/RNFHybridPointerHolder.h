//
//  RNFHybridPointerHolder.h
//  Pods
//
//  Created by Hanno Gödecke on 08.10.24.
//

#pragma once

#include "HybridPointerHolderSpec.hpp"
#include "RNFLogger.h"

namespace margelo {

using namespace facebook;

template <typename T> class HybridPointerHolder : public nitro::RNF::HybridPointerHolderSpec {
protected:
    HybridPointerHolder(const char* name, std::shared_ptr<T> pointer) : HybridPointerHolderSpec(), _name(name), _pointer(pointer) {}
    
    /**
     * Create a new instance of a pointer holder which holds a shared_ptr of the given value.
     * The shared_ptr will be move-constructed.
     * @param name The name of the implementing class, for example "ViewWrapper".
     * @param value The value this class will hold as a shared_ptr. It might be destroyed from JS at any point via `release()`.
     */
    HybridPointerHolder(const char* name, T&& value) : HybridPointerHolder(name, std::make_shared<T>(std::move(value))) {}
    
    /**
     * Called when the PointerHolder gets automatically destroyed (e.g. via GC) and the shared_ptr will be destroyed.
     */
    ~HybridPointerHolder() override {
      nitro::RNF::HybridPointerHolderSpec::~HybridPointerHolderSpec();
      if (_pointer != nullptr) {
          margelo::Logger::log(TAG, "Automatically releasing %s... (~PointerHolder())", TAG);
      }
    }
    
public:
    /**
     * Manually release this reference to the pointer.
     * If there are any other references to this pointer, no memory will be force-deleted.
     */
    virtual void release() override {
      std::unique_lock lock(_mutex);

      if (_pointer == nullptr) {
          throw std::runtime_error("Pointer " + _name + " has already been manually released!");
      }
      margelo::Logger::log(TAG, "Manually releasing %s... (PointerHolder::release())", _name.c_str());
      _pointer = nullptr;
    }
    
    /**
     * Get if the pointer is still valid and strong.
     */
    bool getIsValid() override {
      std::unique_lock lock(_mutex);

      return _pointer != nullptr;
    }

protected:
    /**
     * Get the shared_ptr this class is holding.
     * If it has already been manually released from JS, this method will throw a runtime_error.
     */
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
};
}

