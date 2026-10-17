#import "RNFFilamentMetalView.h"
#import <Metal/Metal.h>
#import <React/RCTViewManager.h>
#import <UIKit/UIKit.h>

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
    metalLayer.framebufferOnly = YES;
    isMounted = false;
  }
  return self;
}

- (void)didMoveToWindow {
  [super didMoveToWindow];

  if (self.window != nil && !isMounted) {
    isMounted = true;
    self.metalLayer.opaque = self.enableTransparentRendering ? NO : YES;
    self.onViewReady(@{});
  }
}

- (void)layoutSubviews {
  [super layoutSubviews];
  CGFloat scale = [UIScreen mainScreen].scale;
  CGSize newSize = CGSizeMake(self.bounds.size.width * scale, self.bounds.size.height * scale);

  // TODO: usually the setter function for drawableSize should be auto wrapped with
  // will- and didChange, however for some reason it seems it isn't. Without it the
  // KVO pattern would break and we would never be notified when the view size changes.
  [self.metalLayer willChangeValueForKey:@"drawableSize"];
  self.metalLayer.drawableSize = newSize;
  [self.metalLayer didChangeValueForKey:@"drawableSize"];
}

@end
