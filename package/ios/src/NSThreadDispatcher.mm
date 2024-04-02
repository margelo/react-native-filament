//
//  NSThreadDispatcher.m
//  react-native-filament
//
//  Created by Marc Rousavy on 02.04.24.
//

#import "NSThreadDispatcher.h"
#import <Foundation/Foundation.h>
#import <functional>

// C++ part
namespace margelo {

NSThreadDispatcher::NSThreadDispatcher(const std::string& name) {
  _thread = [[NSThread alloc] initWithBlock:^{
    // Run Loop for this NSThread
    NSPort* keepAlive = [NSPort port];
    NSRunLoop* loop = [NSRunLoop currentRunLoop];
    [keepAlive scheduleInRunLoop:loop forMode:NSRunLoopCommonModes];
    [loop run];
  }];
  NSString* nsName = [NSString stringWithCString:name.c_str() encoding:kCFStringEncodingUTF8];
  [_thread setName:nsName];
  [_thread setThreadPriority:1.0];
  [_thread start];
}

void NSThreadDispatcher::run(std::function<void()>&& function, bool waitUntilDone) {
  if ([_thread isEqual:[NSThread currentThread]]) {
    function();
  } else {
    dispatch_block_t block = [function = std::move(function)]() {
      // we move the C++ func inside the ObjC block
      function();
    };
    [(id)block performSelector:@selector(invoke) onThread:_thread withObject:nil waitUntilDone:waitUntilDone];
  }
}

void NSThreadDispatcher::runSync(std::function<void()>&& function) {
  run(std::move(function), true);
}

void NSThreadDispatcher::runAsync(std::function<void()>&& function) {
  run(std::move(function), false);
}

} // namespace margelo
