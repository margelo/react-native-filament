//
//  NSThreadDispatcher.m
//  react-native-filament
//
//  Created by Marc Rousavy on 02.04.24.
//

#import "NSThreadDispatcher.h"
#import <Foundation/Foundation.h>
#import <functional>

// Objective-C part
@implementation NSThreadDispatcherObjC {
  NSThread* _thread;
}

- (instancetype)init {
  if (self = [super init]) {
    _thread = [[NSThread alloc] initWithTarget:self selector:@selector(runLoop) object:nil];
    [_thread start];
  }
  return self;
}

- (void)runLoop {
  NSPort* keepAlive = [NSPort port];
  NSRunLoop* loop = [NSRunLoop currentRunLoop];
  [keepAlive scheduleInRunLoop:loop forMode:NSRunLoopCommonModes];
  [loop run];
}

+ (void)runFunction:(std::function<void()>&&)function on:(NSThread*)thread waitUntilDone:(BOOL)waitUntilDone {
  if ([NSThread currentThread] == thread) {
    function();
  } else {
    dispatch_block_t block = [function = std::move(function)]() { function(); };
    [(id)block performSelector:@selector(invoke) onThread:thread withObject:nil waitUntilDone:waitUntilDone];
  }
}

- (void)runSync:(std::function<void()>&&)function {
  [NSThreadDispatcherObjC runFunction:std::move(function) on:_thread waitUntilDone:YES];
}

- (void)runAsync:(std::function<void()>&&)function {
  [NSThreadDispatcherObjC runFunction:std::move(function) on:_thread waitUntilDone:NO];
}

@end

// C++ part
namespace margelo {

NSThreadDispatcher::NSThreadDispatcher() {
  _objcPart = [[NSThreadDispatcherObjC alloc] init];
}

void NSThreadDispatcher::runSync(std::function<void()>&& function) {
  [_objcPart runSync:std::move(function)];
}

void NSThreadDispatcher::runAsync(std::function<void()>&& function) {
  [_objcPart runAsync:std::move(function)];
}

} // namespace margelo
