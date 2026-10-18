#include "threading/RenderLoop.hpp"

#include <android/choreographer.h>
#include <android/looper.h>
#include <fbjni/fbjni.h>
#include <pthread.h>
#include <sys/eventfd.h>
#include <unistd.h>

namespace margelo::nitro::filament {

class RenderLoopAndroid final : public RenderLoop {
public:
  explicit RenderLoopAndroid(RenderLoopDelegate& delegate)
      : delegate_(delegate), looper_(ALooper_prepare(0)), eventFd_(eventfd(0, EFD_NONBLOCK | EFD_CLOEXEC)) {
    pthread_setname_np(pthread_self(), "FilamentRender");
    ALooper_acquire(looper_);
    ALooper_addFd(looper_, eventFd_, ALOOPER_POLL_CALLBACK, ALOOPER_EVENT_INPUT, &RenderLoopAndroid::onEvent, this);
    choreographer_ = AChoreographer_getInstance();
  }

  ~RenderLoopAndroid() override {
    ALooper_removeFd(looper_, eventFd_);
    close(eventFd_);
    ALooper_release(looper_);
  }

  void wake() override {
    uint64_t one = 1;
    write(eventFd_, &one, sizeof(one));
  }

  void setVsyncEnabled(bool enabled) override {
    vsyncEnabled_ = enabled;
    if (enabled && !frameCallbackPosted_) {
      postFrameCallback();
    }
  }

  void run() override {
    facebook::jni::ThreadScope::WithClassLoader([this] {
      while (!quit_) {
        ALooper_pollOnce(-1, nullptr, nullptr, nullptr);
      }
    });
  }

  void quit() override {
    quit_ = true;
    ALooper_wake(looper_);
  }

private:
  static int onEvent(int fd, int, void* data) {
    uint64_t count;
    read(fd, &count, sizeof(count));
    static_cast<RenderLoopAndroid*>(data)->delegate_.onWake();
    return 1;
  }

  static void onFrame(int64_t frameTimeNanos, void* data) {
    auto* loop = static_cast<RenderLoopAndroid*>(data);
    loop->frameCallbackPosted_ = false;
    if (!loop->vsyncEnabled_ || loop->quit_) {
      return;
    }
    loop->delegate_.onVsync(frameTimeNanos);
    if (loop->vsyncEnabled_ && !loop->frameCallbackPosted_) {
      loop->postFrameCallback();
    }
  }

  void postFrameCallback() {
    frameCallbackPosted_ = true;
    if (__builtin_available(android 29, *)) {
      AChoreographer_postFrameCallback64(choreographer_, &RenderLoopAndroid::onFrame, this);
    } else {
      AChoreographer_postFrameCallback(
          choreographer_, [](long frameTimeNanos, void* data) { onFrame(static_cast<int64_t>(frameTimeNanos), data); }, this);
    }
  }

  RenderLoopDelegate& delegate_;
  ALooper* looper_;
  int eventFd_;
  AChoreographer* choreographer_;
  bool vsyncEnabled_ = false;
  bool frameCallbackPosted_ = false;
  bool quit_ = false;
};

std::unique_ptr<RenderLoop> createRenderLoop(RenderLoopDelegate& delegate) {
  return std::make_unique<RenderLoopAndroid>(delegate);
}

} // namespace margelo::nitro::filament
