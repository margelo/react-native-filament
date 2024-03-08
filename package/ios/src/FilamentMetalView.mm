#import "FilamentMetalView.h"
#import <Metal/Metal.h>
#import <UIKit/UIKit.h>
#import <React/RCTViewManager.h>

@implementation FilamentMetalView {
    bool isMounted;
}

+ (Class)layerClass {
  return [CAMetalLayer class];
}

- (CAMetalLayer*)metalLayer {
  return (CAMetalLayer*)self.layer;
}

- (instancetype)init {
  if (self = [super init]) {
    CAMetalLayer* metalLayer = (CAMetalLayer*)self.layer;
    metalLayer.pixelFormat = MTLPixelFormatBGRA8Unorm;
    metalLayer.opaque = NO;
    isMounted = false;
  }
  return self;
}

- (void)didMoveToWindow {
  [super didMoveToWindow];
    
  if (self.window != nil && !isMounted) {
    isMounted = true;
    self.onViewReady(@{});
  }
}

- (void)layoutSubviews {
  [super layoutSubviews];
  CGFloat scale = [UIScreen mainScreen].scale;
  CGSize newSize = CGSizeMake(self.bounds.size.width * scale, self.bounds.size.height * scale);
  self.metalLayer.drawableSize = newSize;
}

@end
