#import "FilamentMetalView.h"
#import <Metal/Metal.h>
#import <UIKit/UIKit.h>

@implementation FilamentMetalView

+ (Class)layerClass {
  return [CAMetalLayer class];
}

- (CAMetalLayer*)metalLayer {
  return (CAMetalLayer*)self.layer;
}

- (instancetype)init {
  if (self = [super init]) {
    // init here
  }
  return self;
}

@end
