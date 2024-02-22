#import "FilamentMetalView.h"
#import <UIKit/UIKit.h>
#import <Metal/Metal.h>

@implementation FilamentMetalView

+ (Class) layerClass {
  return [CAMetalLayer class];
}

- (CAMetalLayer*) metalLayer {
  return (CAMetalLayer*) self.layer;
}

- (instancetype)init {
  if (self = [super init]) {
    // init here
  }
  return self;
}

@end
