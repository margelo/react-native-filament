#import "AppleFilamentView.h"
#import <UIKit/UIKit.h>
#import <Metal/Metal.h>

@implementation AppleFilamentView

+ (Class) layerClass {
  return [CAMetalLayer class];
}

- (CAMetalLayer*) layer {
  return (CAMetalLayer*) super.layer;
}

- (instancetype)init {
  if (self = [super init]) {
    // init here
  }
  return self;
}

@end
