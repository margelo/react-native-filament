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
  bool shouldContinueOnEnterForeground;
}
- (instancetype)initWithCallback:(OnFrameCallback)callback {
  if (self = [super init]) {
    _callback = callback;
    _displayLink = [CADisplayLink displayLinkWithTarget:self selector:@selector(onFrame:)];
    _displayLink.paused = YES;
    shouldContinueOnEnterForeground = NO;
    [_displayLink addToRunLoop:[NSRunLoop currentRunLoop] forMode:NSDefaultRunLoopMode];

    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(appDidEnterBackground)
                                                 name:UIApplicationDidEnterBackgroundNotification
                                               object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(appWillEnterForeground)
                                                 name:UIApplicationWillEnterForegroundNotification
                                               object:nil];
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
  [[NSNotificationCenter defaultCenter] removeObserver:self];
  [_displayLink invalidate];
  _displayLink = nil;
}

- (void)onFrame:(CADisplayLink*)displayLink {
  _callback(displayLink.timestamp * 1e9);
}

// When the app enters the background we need to stop sending commands to metal.
// Otherwise we run the risk of the metal view becoming blank, or not being able to update it anymore.
- (void)appDidEnterBackground {
  shouldContinueOnEnterForeground = !_displayLink.paused;
  _displayLink.paused = YES;
  NSLog(@"[react-native-filament] [DisplayLinkListener] Paused rendering, app entered background.");
}

- (void)appWillEnterForeground {
  if (shouldContinueOnEnterForeground) {
    _displayLink.paused = NO;
    NSLog(@"[react-native-filament] [DisplayLinkListener] Resumed rendering, app entered foreground.");
  }
}

- (void)dealloc {
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

@end
