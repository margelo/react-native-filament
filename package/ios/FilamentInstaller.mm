//
//  FilamentInstaller.m
//  react-native-filament
//
//  Created by Marc Rousavy on 20.02.24.
//

#import <Foundation/Foundation.h>
#import "FilamentInstaller.h"
#import "AppleFilamentProxy.h"
#import <ReactCommon/CallInvoker.h>

#import <React/RCTBridge+Private.h>
#import <React/RCTBridge.h>

using namespace facebook;

// This is defined in RCTCxxBridge.mm, and we are technically using a private API here.
@interface RCTCxxBridge (CallInvoker)
- (std::shared_ptr<react::CallInvoker>)jsCallInvoker;
@end

@implementation FilamentInstaller

+ (BOOL)installToBridge:(RCTBridge *)bridge {
  RCTCxxBridge* cxxBridge = (RCTCxxBridge*)[RCTBridge currentBridge];
  if (!cxxBridge.runtime) {
    return NO;
  }

  jsi::Runtime* runtime = (jsi::Runtime*)cxxBridge.runtime;
  if (!runtime) {
    return NO;
  }
  std::shared_ptr<react::CallInvoker> callInvoker = cxxBridge.jsCallInvoker;
  if (!callInvoker) {
    return NO;
  }

  // global.__filamentProxy
  auto filamentProxy = std::make_shared<margelo::AppleFilamentProxy>(runtime, callInvoker);
  runtime->global().setProperty(*runtime, "__filamentProxy", jsi::Object::createFromHostObject(*runtime, filamentProxy));

  return YES;
}

@end
