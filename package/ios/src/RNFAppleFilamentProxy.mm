//
//  AppleFilamentProxy.mm
//  react-native-filament
//
//  Created by Marc Rousavy on 20.02.24.
//

#import "RNFAppleFilamentProxy.h"
#import "RNFAppleChoreographer.h"
#import "RNFAppleDispatcher.h"
#import "RNFAppleFilamentRecorder.h"
#import "RNFAppleFilamentView.h"
#import "RNFAppleManagedBuffer.h"
#import "RNFFilamentMetalView.h"
#import "RNFFilamentView.h"
#import "RNFNSThreadDispatcher.h"
#import <Foundation/Foundation.h>
#import <React/RCTBridge+Private.h>
#import <React/RCTBridge.h>
#import <React/RCTUIManager.h>
#import <React/RCTUtils.h>

#ifdef RCT_NEW_ARCH_ENABLED
#import "RNFFilamentComponent.h"
#import <React/RCTSurfacePresenter.h>
#endif

namespace margelo {

#ifdef RCT_NEW_ARCH_ENABLED
AppleFilamentProxy::AppleFilamentProxy(jsi::Runtime* runtime, std::shared_ptr<Dispatcher> jsDispatcher,
                                       __weak RCTSurfacePresenter* surfacePresenter)
    : _runtime(runtime), _jsDispatcher(jsDispatcher), _surfacePresenter(surfacePresenter) {}
#else
AppleFilamentProxy::AppleFilamentProxy(jsi::Runtime* runtime, std::shared_ptr<margelo::Dispatcher> jsDispatcher)
    : _runtime(runtime), _jsDispatcher(jsDispatcher) {}
#endif

std::shared_ptr<FilamentBuffer> AppleFilamentProxy::loadAsset(const std::string& path) {
  NSString* filePath = [NSString stringWithUTF8String:path.c_str()];
  // Check if its a web uri, if so load using NSData
  if ([filePath hasPrefix:@"http://"] || [filePath hasPrefix:@"https://"]) {
      margelo::Logger::log(TAG, "Fetching %s...", [filePath cStringUsingEncoding:NSUTF8StringEncoding]);
    NSURL* url = [NSURL URLWithString:filePath];
    NSData* data = [NSData dataWithContentsOfURL:url];
    if (data == nil) {
      throw std::runtime_error("Could not load file from URL");
    }
    auto managedBuffer = std::make_shared<AppleManagedBuffer>(data);
    return std::make_shared<FilamentBuffer>(managedBuffer);
  }

  // Check if we want to load from file path:
  if ([filePath hasPrefix:@"file://"]) {
    filePath = [filePath substringFromIndex:7];

    // Load the data from the file
    NSError* errorPtr;
    NSData* bufferData = [NSData dataWithContentsOfFile:filePath options:NSDataReadingMappedIfSafe error:&errorPtr];
    if (!bufferData || errorPtr != nullptr) {
      throw std::runtime_error("File not found or could not be read, error: " + std::string(errorPtr.localizedDescription.UTF8String));
    }
    auto managedBuffer = std::make_shared<AppleManagedBuffer>(bufferData);
    return std::make_shared<FilamentBuffer>(managedBuffer);
  }

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

std::shared_ptr<margelo::Dispatcher> AppleFilamentProxy::getJSDispatcher() {
  return _jsDispatcher;
}

std::shared_ptr<margelo::Dispatcher> AppleFilamentProxy::getRenderThreadDispatcher() {
  if (_renderThreadDispatcher == nullptr) {
    // Filament has a strong requirement that you can only render from one single Thread.
    // iOS dispatch_queues may use multiple Threads, so we need to use NSThreadDispatcher instead of
    // AppleDispatcher.
    _renderThreadDispatcher = std::make_shared<NSThreadDispatcher>("filament.render.queue");
  }
  return _renderThreadDispatcher;
}

std::shared_ptr<margelo::Dispatcher> AppleFilamentProxy::getUIDispatcher() {
  if (_uiDispatcher == nullptr) {
    _uiDispatcher = std::make_shared<AppleDispatcher>(dispatch_get_main_queue());
  }
  return _uiDispatcher;
}

std::shared_ptr<margelo::Dispatcher> AppleFilamentProxy::getBackgroundDispatcher() {
  if (_backgroundDispatcher == nullptr) {
    dispatch_queue_attr_t qos = dispatch_queue_attr_make_with_qos_class(DISPATCH_QUEUE_CONCURRENT, QOS_CLASS_USER_INITIATED, -1);
    dispatch_queue_t queue = dispatch_queue_create("filament.background.queue", qos);
    _backgroundDispatcher = std::make_shared<AppleDispatcher>(queue);
  }
  return _backgroundDispatcher;
}

float AppleFilamentProxy::getDisplayRefreshRate() {
  CGFloat refreshRate = [UIScreen mainScreen].maximumFramesPerSecond;
  return refreshRate;
}

float AppleFilamentProxy::getDensityPixelRatio() {
  CGFloat scale = [UIScreen mainScreen].scale;
  return scale;
}

jsi::Runtime& AppleFilamentProxy::getMainJSRuntime() {
  if (_runtime == nullptr) {
    [[unlikely]];
    throw std::runtime_error("JSI Runtime was null!");
  }
  return *_runtime;
}

#ifdef RCT_NEW_ARCH_ENABLED
std::shared_ptr<FilamentView> AppleFilamentProxy::findFilamentView(int viewId) {
  UIView* anonymousView = [_surfacePresenter findComponentViewWithTag_DO_NOT_USE_DEPRECATED:viewId];

  if (anonymousView == nil) {
    throw std::runtime_error("Could not find view with given tag");
  }

  FilamentComponent* view = (FilamentComponent*)anonymousView;   // The UIView is a FilamentComponent
  FilamentMetalView* filamentMetalView = view.filamentMetalView; // Get the underlying FilamentMetalView
  return std::make_shared<AppleFilamentView>(filamentMetalView);
}
#else
std::shared_ptr<FilamentView> AppleFilamentProxy::findFilamentView(int viewId) {
  RCTBridge* currentBridge = [RCTBridge currentBridge]; // <-- from <React/RCTBridge+Private.h>
  RCTUIManager* uiManager = currentBridge.uiManager;    // <-- from <React/RCTUIManager.h>

  UIView* anonymousView = [uiManager viewForReactTag:[NSNumber numberWithInt:viewId]];
  FilamentMetalView* view = (FilamentMetalView*)anonymousView;
  return std::make_shared<AppleFilamentView>(view);
}
#endif

std::shared_ptr<Choreographer> AppleFilamentProxy::createChoreographer() {
  std::shared_ptr<AppleChoreographer> choreographer = std::make_shared<AppleChoreographer>();
  return std::static_pointer_cast<Choreographer>(choreographer);
}

std::shared_ptr<FilamentRecorder> AppleFilamentProxy::createRecorder(int width, int height, int fps, double bitRate) {
  std::shared_ptr<AppleFilamentRecorder> recorder =
      std::make_shared<AppleFilamentRecorder>(_renderThreadDispatcher, width, height, fps, bitRate);
  return std::static_pointer_cast<FilamentRecorder>(recorder);
}

} // namespace margelo
