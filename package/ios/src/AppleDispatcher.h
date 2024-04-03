//
//  AppleDispatcher.h
//  react-native-filament
//
//  Created by Marc Rousavy on 12.03.24.
//

#pragma once

#include "threading/Dispatcher.h"
#include <Foundation/Foundation.h>

namespace margelo {

/**
 A [Dispatcher] implementation that uses iOS dispatch_queues to schedule calls.
 */
class AppleDispatcher : public Dispatcher {
public:
  explicit AppleDispatcher(dispatch_queue_t dispatchQueue) : _dispatchQueue(dispatchQueue) {}

public:
  void runSync(std::function<void()>&& function) override {
    dispatch_sync(_dispatchQueue, [function = std::move(function)]() { function(); });
  }

  void runAsync(std::function<void()>&& function) override {
    dispatch_async(_dispatchQueue, [function = std::move(function)]() { function(); });
  }

private:
  dispatch_queue_t _dispatchQueue;
};

} // namespace margelo
