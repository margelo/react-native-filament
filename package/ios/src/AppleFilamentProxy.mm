//
//  AppleFilamentProxy.mm
//  react-native-filament
//
//  Created by Marc Rousavy on 20.02.24.
//

#import "AppleFilamentProxy.h"
#import "AppleChoreographer.h"
#import "AppleDispatcher.h"
#import "AppleFilamentView.h"
#import "AppleManagedBuffer.h"
#import "FilamentMetalView.h"
#import "FilamentView.h"
#import "threading/ThreadDispatcher.h"
#import <Foundation/Foundation.h>
#import <React/RCTBridge+Private.h>
#import <React/RCTBridge.h>
#import <React/RCTUIManager.h>
#import <React/RCTUtils.h>

namespace margelo {

AppleFilamentProxy::AppleFilamentProxy(jsi::Runtime* runtime, std::shared_ptr<react::CallInvoker> callInvoker)
    : _runtime(runtime), _callInvoker(callInvoker) {}

AppleFilamentProxy::~AppleFilamentProxy() {
  // TODO(hanno): cleanup here?
}

std::shared_ptr<FilamentBuffer> AppleFilamentProxy::loadAsset(std::string path) {
  NSString* filePath = [NSString stringWithUTF8String:path.c_str()];

  // Split the path at the last dot to separate name and extension
  NSArray<NSString*>* pathComponents = [filePath componentsSeparatedByString:@"."];
  if ([pathComponents count] < 2) {
    throw std::runtime_error("Invalid file path: no extension found");
  }
  NSString* name = [pathComponents firstObject];
  NSString* extension = [pathComponents lastObject];

  // Load the resource from the main bundle
  NSString* resourcePath = [[NSBundle mainBundle] pathForResource:name ofType:extension];
  if (!resourcePath) {
    throw std::runtime_error("File not found");
  }

  // Load the data from the file
  NSData* bufferData = [NSData dataWithContentsOfFile:resourcePath];
  if (!bufferData) {
    throw std::runtime_error("File not found or could not be read");
  }

  auto managedBuffer = std::make_shared<AppleManagedBuffer>(bufferData);
  return std::make_shared<FilamentBuffer>(managedBuffer);
}

std::shared_ptr<Dispatcher> AppleFilamentProxy::getRenderThreadDispatcher() {
  if (_renderThreadDispatcher == nullptr) {
    // Filament has a strong requirement that you can only render from one single Thread.
    // iOS dispatch_queues may use multiple Threads, so we need to use ThreadDispatcher instead of
    // AppleDispatcher.
    _renderThreadDispatcher = std::make_shared<ThreadDispatcher>();
  }
  return _renderThreadDispatcher;
}

std::shared_ptr<Dispatcher> AppleFilamentProxy::getUIDispatcher() {
  if (_uiDispatcher == nullptr) {
    _uiDispatcher = std::make_shared<AppleDispatcher>(dispatch_get_main_queue());
  }
  return _uiDispatcher;
}

std::shared_ptr<Dispatcher> AppleFilamentProxy::getBackgroundDispatcher() {
  if (_backgroundDispatcher == nullptr) {
    dispatch_queue_attr_t qos = dispatch_queue_attr_make_with_qos_class(DISPATCH_QUEUE_CONCURRENT, QOS_CLASS_USER_INITIATED, -1);
    dispatch_queue_t queue = dispatch_queue_create("filament.background.queue", qos);
    _backgroundDispatcher = std::make_shared<AppleDispatcher>(queue);
  }
  return _backgroundDispatcher;
}

jsi::Runtime& AppleFilamentProxy::getRuntime() {
  if (_runtime == nullptr) {
    [[unlikely]];
    throw std::runtime_error("JSI Runtime was null!");
  }
  return *_runtime;
}

std::shared_ptr<react::CallInvoker> AppleFilamentProxy::getCallInvoker() {
  return _callInvoker;
}

std::shared_ptr<FilamentView> AppleFilamentProxy::findFilamentView(int viewId) {
  // TODO(marc): Make this async when JSIConvert can do that
  std::shared_ptr<AppleFilamentView> result;
  RCTUnsafeExecuteOnMainQueueSync([viewId, &result]() {
    RCTBridge* currentBridge = [RCTBridge currentBridge]; // <-- from <React/RCTBridge+Private.h>
    RCTUIManager* uiManager = currentBridge.uiManager;    // <-- from <React/RCTUIManager.h>
    UIView* anonymousView = [uiManager viewForReactTag:[NSNumber numberWithInt:viewId]];
    FilamentMetalView* view = (FilamentMetalView*)anonymousView;
    result.reset(new AppleFilamentView(view));
  });
  return std::static_pointer_cast<FilamentView>(result);
}

std::shared_ptr<Choreographer> AppleFilamentProxy::createChoreographer() {
  std::shared_ptr<AppleChoreographer> choreographer = std::make_shared<AppleChoreographer>();
  return std::static_pointer_cast<Choreographer>(choreographer);
}

} // namespace margelo
