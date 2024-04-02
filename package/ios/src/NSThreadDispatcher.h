//
//  NSThreadDispatcher.m
//  react-native-filament
//
//  Created by Marc Rousavy on 02.04.24.
//

#pragma once

#include "threading/Dispatcher.h"
#include <Foundation/Foundation.h>
#include <string>

namespace margelo {

/**
 A [Dispatcher] implementation that uses an Objective-C NSThread.
 */
class NSThreadDispatcher : public Dispatcher {
public:
  explicit NSThreadDispatcher(const std::string& name);

public:
  void runSync(std::function<void()>&& function) override;
  void runAsync(std::function<void()>&& function) override;

private:
  __attribute__((hot)) void run(std::function<void()>&& function, bool waitUntilDone);

private:
  NSThread* _thread;
};

} // namespace margelo
