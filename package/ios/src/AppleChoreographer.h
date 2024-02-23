//
//  AppleChoreographer.h
//  Pods
//
//  Created by Marc Rousavy on 23.02.24.
//

#pragma once

#include "Choreographer.h"
#import <Foundation/Foundation.h>

@interface DisplayLinkListener : NSObject
typedef void (^ OnFrameCallback)(double timestamp);

- (instancetype) initWithCallback:(OnFrameCallback)callback;
- (void) start;
- (void) stop;
- (void) onFrame:(CADisplayLink*)displayLink;

@end

namespace margelo {

class AppleChoreographer: public Choreographer {
public:
  explicit AppleChoreographer();
  
  void stop() override;
  void start() override;
  
private:
  DisplayLinkListener* _displayLink;
};

} // namespace margelo
