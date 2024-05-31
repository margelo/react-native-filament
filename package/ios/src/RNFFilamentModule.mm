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

#ifndef RCT_NEW_ARCH_ENABLED
#import <ReactCommon/CallInvoker.h>
#import <React/RCTBridge.h>
#endif

#ifdef RCT_NEW_ARCH_ENABLED
#import <React/RCTSurfacePresenter.h>
#import <React/RCTScheduler.h>
#import <React/RCTUIManager.h>
#import <react/renderer/components/rnfilament/ShadowNodes.h>

using namespace facebook;

@interface RCTBridge (JSIRuntime)
- (void *)runtime;
- (std::shared_ptr<react::CallInvoker>)jsCallInvoker;
@end

@implementation FilamentModule {
  __weak RCTSurfacePresenter *_surfacePresenter;
  BOOL _isBridgeless;
}

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
  } else {
    jsiRuntime = [self.bridge respondsToSelector:@selector(runtime)] ? reinterpret_cast<jsi::Runtime *>(self.bridge.runtime) : nullptr;
    jsCallInvoker = self.bridge.jsCallInvoker;
    _surfacePresenter = self.bridge.surfacePresenter;
  }

  if (jsiRuntime == nullptr) {
    NSLog(@"Failed to install react-native-filament: jsi::Runtime is nil (bridgless: %@)!", _isBridgeless ? @"YES" : @"NO");
    return [NSNumber numberWithBool:NO];
  }
  if (jsCallInvoker == nullptr) {
    NSLog(@"Failed to install react-native-filament: react::CallInvoker is nil (bridgless: %@)!", _isBridgeless ? @"YES" : @"NO");
    return [NSNumber numberWithBool:NO];
  }
    
  BOOL result = [FilamentInstaller installToBridge:jsiRuntime callInvoker:jsCallInvoker surfacePresenter:_surfacePresenter];
  return [NSNumber numberWithBool:result];
}

- (std::shared_ptr<react::TurboModule>)getTurboModule:(const react::ObjCTurboModule::InitParams &)params {
  return std::make_shared<react::NativeFilamentModuleSpecJSI>(params);
}

@end

#else
// Implementation for old arch

// This is defined in RCTCxxBridge.mm, and we are technically using a private API here.
@interface RCTCxxBridge (CallInvoker)
- (std::shared_ptr<react::CallInvoker>)jsCallInvoker;
@end

@implementation FilamentModule

RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(install) {
  RCTCxxBridge* cxxBridge = (RCTCxxBridge*)[RCTBridge currentBridge];
  if (!cxxBridge.runtime) {
    NSLog(@"Failed to install react-native-filament: RCTBridge is not a RCTCxxBridge!");
    return [NSNumber numberWithBool:NO];
  }

  jsi::Runtime* runtime = (jsi::Runtime*)cxxBridge.runtime;
  if (!runtime) {
    NSLog(@"Failed to install react-native-filament: jsi::Runtime* was null!");
    return [NSNumber numberWithBool:NO];
  }
  std::shared_ptr<react::CallInvoker> callInvoker = cxxBridge.jsCallInvoker;
  if (!callInvoker) {
    NSLog(@"Failed to install react-native-filament: react::CallInvoker was null!");
    return [NSNumber numberWithBool:NO];
  }
  
  BOOL result = [FilamentInstaller installToBridge:runtime callInvoker:callInvoker];
  return [NSNumber numberWithBool:result];
}

RCT_EXPORT_MODULE(FilamentModule);

@end

#endif
