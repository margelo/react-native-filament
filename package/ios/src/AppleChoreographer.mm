//
//  AppleChoreographer.m
//  DoubleConversion
//
//  Created by Marc Rousavy on 23.02.24.
//

#include "AppleChoreographer.h"

namespace margelo {

AppleChoreographer::AppleChoreographer() {
  _displayLink = [[DisplayLinkListener alloc] initWithCallback:^(double timestamp) {
    onFrame(timestamp);
  }];
}

AppleChoreographer::~AppleChoreographer() {
  [_displayLink invalidate];
}

void AppleChoreographer::stop() {
  [_displayLink stop];
}

void AppleChoreographer::start() {
  [_displayLink start];
}

} // namespace margelo
