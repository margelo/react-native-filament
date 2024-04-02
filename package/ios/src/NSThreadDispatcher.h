//
//  NSThreadDispatcher.m
//  react-native-filament
//
//  Created by Marc Rousavy on 02.04.24.
//

#pragma once

#include "threading/Dispatcher.h"
#include <Foundation/Foundation.h>

/**
 Objective-C Part of the [NSThreadDispatcher].
 */
@interface NSThreadDispatcherObjC : NSObject
- (void)runLoop;
- (void)runSync:(std::function<void()>&&)function;
- (void)runAsync:(std::function<void()>&&)function;
@end

namespace margelo {

/**
 A [Dispatcher] implementation that uses an Objective-C NSThread.
 */
class NSThreadDispatcher : public Dispatcher {
public:
  explicit NSThreadDispatcher();

public:
  void runSync(std::function<void()>&& function) override;
  void runAsync(std::function<void()>&& function) override;

private:
  NSThreadDispatcherObjC* _objcPart;
};

} // namespace margelo
