#include "threading/RenderLoop.hpp"

#import <Foundation/Foundation.h>
#import <QuartzCore/QuartzCore.h>

@interface RNFDisplayLinkTarget : NSObject
- (instancetype)initWithHandler:(void (^)(CADisplayLink*))handler;
- (void)onDisplayLink:(CADisplayLink*)displayLink;
@end

@implementation RNFDisplayLinkTarget {
  void (^_handler)(CADisplayLink*);
}

- (instancetype)initWithHandler:(void (^)(CADisplayLink*))handler {
  if (self = [super init]) {
    _handler = handler;
  }
  return self;
}

- (void)onDisplayLink:(CADisplayLink*)displayLink {
  _handler(displayLink);
}

@end

namespace margelo::nitro::filament {

class RenderLoopApple final : public RenderLoop {
public:
  explicit RenderLoopApple(RenderLoopDelegate& delegate) : delegate_(delegate), runLoop_(CFRunLoopGetCurrent()) {
    [NSThread currentThread].name = @"FilamentRender";
    CFRunLoopSourceContext context{};
    context.info = this;
    context.perform = [](void* info) {
      @autoreleasepool {
        static_cast<RenderLoopApple*>(info)->delegate_.onWake();
      }
    };
    source_ = CFRunLoopSourceCreate(kCFAllocatorDefault, 0, &context);
    CFRunLoopAddSource(runLoop_, source_, kCFRunLoopDefaultMode);

    RenderLoopDelegate* delegatePointer = &delegate_;
    target_ = [[RNFDisplayLinkTarget alloc] initWithHandler:^(CADisplayLink* displayLink) {
      @autoreleasepool {
        delegatePointer->onVsync(static_cast<int64_t>(displayLink.timestamp * 1e9));
      }
    }];
    displayLink_ = [CADisplayLink displayLinkWithTarget:target_ selector:@selector(onDisplayLink:)];
    displayLink_.paused = YES;
    [displayLink_ addToRunLoop:[NSRunLoop currentRunLoop] forMode:NSDefaultRunLoopMode];
  }

  ~RenderLoopApple() override {
    [displayLink_ invalidate];
    CFRunLoopRemoveSource(runLoop_, source_, kCFRunLoopDefaultMode);
    CFRelease(source_);
  }

  void wake() override {
    CFRunLoopSourceSignal(source_);
    CFRunLoopWakeUp(runLoop_);
  }

  void setVsyncEnabled(bool enabled) override {
    displayLink_.paused = !enabled;
  }

  void run() override {
    CFRunLoopRun();
  }

  void quit() override {
    displayLink_.paused = YES;
    CFRunLoopStop(runLoop_);
  }

private:
  RenderLoopDelegate& delegate_;
  CFRunLoopRef runLoop_;
  CFRunLoopSourceRef source_;
  RNFDisplayLinkTarget* target_;
  CADisplayLink* displayLink_;
};

std::unique_ptr<RenderLoop> createRenderLoop(RenderLoopDelegate& delegate) {
  return std::make_unique<RenderLoopApple>(delegate);
}

} // namespace margelo::nitro::filament
