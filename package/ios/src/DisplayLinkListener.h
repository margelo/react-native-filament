//
//  DisplayLinkListener.h
//  Pods
//
//  Created by Marc Rousavy on 23.02.24.
//

#pragma once

#import <Foundation/Foundation.h>
#import <QuartzCore/CADisplayLink.h>

@interface DisplayLinkListener : NSObject
typedef void (^OnFrameCallback)(double timestamp);

- (instancetype)initWithCallback:(OnFrameCallback)callback;
- (void)start;
- (void)stop;
- (void)onFrame:(CADisplayLink*)displayLink;

@end
