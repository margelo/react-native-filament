//
//  FilamentInstaller.m
//  react-native-filament
//
//  Created by Marc Rousavy on 20.02.24.
//

#import "FilamentInstaller.h"
#import "AppleFilamentProxy.h"
#import "PromiseFactory.h"
#import <Foundation/Foundation.h>
#import <ReactCommon/CallInvoker.h>

#import <React/RCTBridge+Private.h>
#import <React/RCTBridge.h>

using namespace facebook;

// This is defined in RCTCxxBridge.mm, and we are technically using a private API here.
@interface RCTCxxBridge (CallInvoker)
- (std::shared_ptr<react::CallInvoker>)jsCallInvoker;
@end

@implementation FilamentInstaller

+ (BOOL)installToBridge:(RCTBridge*)bridge {
  RCTCxxBridge* cxxBridge = (RCTCxxBridge*)[RCTBridge currentBridge];
  if (!cxxBridge.runtime) {
    NSLog(@"Failed to install react-native-filament: RCTBridge is not a RCTCxxBridge!");
    return NO;
  }

  jsi::Runtime* runtime = (jsi::Runtime*)cxxBridge.runtime;
  if (!runtime) {
    NSLog(@"Failed to install react-native-filament: jsi::Runtime* was null!");
    return NO;
  }
  std::shared_ptr<react::CallInvoker> callInvoker = cxxBridge.jsCallInvoker;
  if (!callInvoker) {
    NSLog(@"Failed to install react-native-filament: react::CallInvoker was null!");
    return NO;
  }

  // global.FilamentProxy
  auto filamentProxy = std::make_shared<margelo::AppleFilamentProxy>(runtime, callInvoker);
  runtime->global().setProperty(*runtime, "FilamentProxy", jsi::Object::createFromHostObject(*runtime, filamentProxy));

  // PromiseFactory
  margelo::PromiseFactory::install(*runtime, callInvoker);

  return YES;
}

@end
