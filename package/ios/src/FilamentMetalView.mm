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
    self.opaque = NO;
  }
  return self;
}

- (void)layoutSubviews {
  [super layoutSubviews];
  CGFloat scale = [UIScreen mainScreen].scale;
  CGSize newSize = CGSizeMake(self.bounds.size.width * scale, self.bounds.size.height * scale);
  self.metalLayer.drawableSize = newSize;
}

@end
