//
//  FilamentModule.mm
//  react-native-filament
//
//  Created by Marc Rousavy on 22.02.24.
//

#import "RNFFilamentModule.h"
#import "RNFFilamentInstaller.h"
#import <Foundation/Foundation.h>
#import <React/RCTBridge+Private.h>

#ifdef RCT_NEW_ARCH_ENABLED
#import <React/RCTSurfacePresenter.h>
#import <React/RCTScheduler.h>
#import <React/RCTUIManager.h>

using namespace facebook;

@interface RCTBridge (JSIRuntime)
- (void *)runtime;
- (std::shared_ptr<react::CallInvoker>)jsCallInvoker;
@end

@implementation FilamentModule {
  __weak RCTSurfacePresenter *_surfacePresenter;
  BOOL _isBridgeless;
}

@synthesize runtimeExecutor = _runtimeExecutor;

RCT_EXPORT_MODULE()

/*
 * Taken from RCTNativeAnimatedTurboModule:
 * This selector is invoked via BridgelessTurboModuleSetup.
 */
- (void)setSurfacePresenter:(id<RCTSurfacePresenterStub>)surfacePresenter
{
  _surfacePresenter = surfacePresenter;
  _isBridgeless = true;
}

- (NSNumber*)install {
  jsi::Runtime *jsiRuntime = nullptr;
  std::shared_ptr<react::CallInvoker> jsCallInvoker = nullptr;
  if (_isBridgeless) {
    // If we are in bridgless mode we can cast directly to RCTCxxBridge to get our properties:
    RCTCxxBridge *cxxBridge = (RCTCxxBridge *)self.bridge;
    jsiRuntime = (jsi::Runtime *)cxxBridge.runtime;
    jsCallInvoker = cxxBridge.jsCallInvoker;
    RCTScheduler *scheduler = [_surfacePresenter scheduler];
    std::shared_ptr<react::UIManager> uiManager = scheduler.uiManager;
    
  } else {
    // TODO: I haven't tested bridge mode w/ new arch yet
    jsiRuntime = [self.bridge respondsToSelector:@selector(runtime)] ? reinterpret_cast<jsi::Runtime *>(self.bridge.runtime) : nullptr;
    jsCallInvoker = self.bridge.jsCallInvoker;
    // TODO: how to get the UI Manager in none bridgeless mode?
    RCTUIManager* uiManager = self.bridge.uiManager;
  }

  if (jsiRuntime == nullptr) {
    NSLog(@"Failed to install react-native-filament: jsi::Runtime is nil (bridgless: %@)!", _isBridgeless ? @"YES" : @"NO");
    return [NSNumber numberWithBool:NO];
  }
  if (jsCallInvoker == nullptr) {
    NSLog(@"Failed to install react-native-filament: react::CallInvoker is nil (bridgless: %@)!", _isBridgeless ? @"YES" : @"NO");
    return [NSNumber numberWithBool:NO];
  }
    
  BOOL result = [FilamentInstaller installToBridge:jsiRuntime callInvoker:jsCallInvoker];
  return [NSNumber numberWithBool:result];
}

- (std::shared_ptr<react::TurboModule>)getTurboModule:(const react::ObjCTurboModule::InitParams &)params {
  return std::make_shared<react::NativeFilamentModuleSpecJSI>(params);
}

@end

#else

// Implementation for old arch
@implementation FilamentModule

// TODO: Figure out how to get jsi::Runtime and CallInvoker in bridge-less mode.
RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(install) {
  RCTBridge* bridge = [RCTBridge currentBridge];
  if (bridge == nil) {
    NSLog(@"Failed to install react-native-filament: RCTBridge is nil!");
    return [NSNumber numberWithBool:NO];
  }
  BOOL result = [FilamentInstaller installToBridge:bridge];
  // TODO: Can we return a bool here instead? Or maybe even throw errors?
  return [NSNumber numberWithBool:result];
}

RCT_EXPORT_MODULE(FilamentModule);

@end

#endif
