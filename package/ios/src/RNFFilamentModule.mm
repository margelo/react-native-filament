//
//  FilamentModule.mm
//  react-native-filament
//
//  Created by Marc Rousavy on 22.02.24.
//

#import "RNFFilamentModule.h"
#import "RNFFilamentInstaller.h"
#import <Foundation/Foundation.h>

#ifndef RCT_NEW_ARCH_ENABLED
#import <React/RCTBridge+Private.h>
#import <React/RCTBridge.h>
#import <ReactCommon/CallInvoker.h>
#endif

#ifdef RCT_NEW_ARCH_ENABLED
#import <React/RCTCallInvoker.h>
#import <React/RCTSurfacePresenter.h>
#import <React/RCTSurfacePresenterStub.h>
#import <react/renderer/components/rnfilament/ShadowNodes.h>

using namespace facebook;

// Implemented by RCTBridgeProxy (bridgeless) and RCTCxxBridge. Same trick react-native-worklets uses.
@interface RCTBridge (JSIRuntime)
- (void*)runtime;
@end

@implementation FilamentModule {
  __weak RCTSurfacePresenter* _surfacePresenter;
}

// Set by the TurboModule manager because we conform to RCTCallInvokerModule.
@synthesize callInvoker = _callInvoker;

RCT_EXPORT_MODULE()

/*
 * Taken from RCTNativeAnimatedTurboModule:
 * This selector is invoked via BridgelessTurboModuleSetup.
 */
- (void)setSurfacePresenter:(id<RCTSurfacePresenterStub>)surfacePresenter {
  _surfacePresenter = (RCTSurfacePresenter*)surfacePresenter;
}

- (NSNumber*)install {
  // In bridgeless mode `bridge` is an RCTBridgeProxy. It forwards selectors, so don't guard with respondsToSelector.
  jsi::Runtime* jsiRuntime = self.bridge != nil ? reinterpret_cast<jsi::Runtime*>(self.bridge.runtime) : nullptr;
  std::shared_ptr<react::CallInvoker> jsCallInvoker = _callInvoker != nil ? _callInvoker.callInvoker : nullptr;
  if (_surfacePresenter == nil) {
    // Not bridgeless: setSurfacePresenter: was never called, ask the bridge.
    _surfacePresenter = (RCTSurfacePresenter*)self.bridge.surfacePresenter;
  }

  if (jsiRuntime == nullptr) {
    NSLog(@"Failed to install react-native-filament: jsi::Runtime is nil!");
    return [NSNumber numberWithBool:NO];
  }
  if (jsCallInvoker == nullptr) {
    NSLog(@"Failed to install react-native-filament: react::CallInvoker is nil!");
    return [NSNumber numberWithBool:NO];
  }

  BOOL result = [FilamentInstaller installToBridge:jsiRuntime callInvoker:jsCallInvoker surfacePresenter:_surfacePresenter];
  return [NSNumber numberWithBool:result];
}

- (std::shared_ptr<react::TurboModule>)getTurboModule:(const react::ObjCTurboModule::InitParams&)params {
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
