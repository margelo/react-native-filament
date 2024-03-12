//
//  AppleDispatcher.h
//  react-native-filament
//
//  Created by Marc Rousavy on 12.03.24.
//

#pragma once

#include "Dispatcher.h"
#include <Foundation/Foundation.h>

namespace margelo {

class AppleDispatcher : public Dispatcher {
public:
  explicit AppleDispatcher(dispatch_queue_t dispatchQueue) : _dispatchQueue(dispatchQueue) {}

public:
  void scheduleTrigger() override {
    dispatch_async(_dispatchQueue, ^{
      trigger();
    });
  }

private:
  dispatch_queue_t _dispatchQueue;
};

} // namespace margelo
