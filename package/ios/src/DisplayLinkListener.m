//
//  DisplayLinkListener.m
//  DoubleConversion
//
//  Created by Marc Rousavy on 23.02.24.
//

#import "DisplayLinkListener.h"
#import <Foundation/Foundation.h>
#import <QuartzCore/CADisplayLink.h>

@implementation DisplayLinkListener {
  CADisplayLink* _Nullable _displayLink;
  OnFrameCallback _callback;
}
- (instancetype)initWithCallback:(OnFrameCallback)callback {
  if (self = [super init]) {
    _callback = callback;
    _displayLink = [CADisplayLink displayLinkWithTarget:self selector:@selector(onFrame:)];
    _displayLink.paused = YES;
    [_displayLink addToRunLoop:[NSRunLoop mainRunLoop] forMode:NSDefaultRunLoopMode];
  }
  return self;
}

- (void)start {
  _displayLink.paused = NO;
}

- (void)stop {
  _displayLink.paused = YES;
}

- (void)invalidate {
  [_displayLink invalidate];
  _displayLink = nil;
}

- (void)onFrame:(CADisplayLink*)displayLink {
  _callback(displayLink.timestamp * 1e9);
}

@end
