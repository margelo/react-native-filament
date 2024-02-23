//
//  AppleChoreographer.m
//  DoubleConversion
//
//  Created by Marc Rousavy on 23.02.24.
//

#include "AppleChoreographer.h"
#import <Foundation/Foundation.h>

@implementation DisplayLinkListener {
  CADisplayLink* _Nullable _displayLink;
  OnFrameCallback _callback;
}
- (instancetype)initWithCallback:(OnFrameCallback)callback {
  if (self = [super init]) {
    _callback = callback;
  }
}

- (void)start {
  _displayLink = [CADisplayLink displayLinkWithTarget:self selector:@selector(onFrame:)];
  [_displayLink addToRunLoop:[NSRunLoop currentRunLoop] forMode:NSDefaultRunLoopMode];
}

- (void)stop {
  [_displayLink invalidate];
  _displayLink = nil;
}

- (void)onFrame:(CADisplayLink *)displayLink {
  _callback(displayLink.timestamp);
}

@end

namespace margelo {

AppleChoreographer::AppleChoreographer() {
  _displayLink = [[DisplayLinkListener alloc] initWithCallback:^(double timestamp) {
    onFrame(timestamp);
  }];
}

void AppleChoreographer::stop() {
  [_displayLink stop];
}

void AppleChoreographer::start() {
  [_displayLink start];
}

} // namespace margelo
