//
//  FilamentModule.mm
//  react-native-filament
//
//  Created by Marc Rousavy on 22.02.24.
//

#import <Foundation/Foundation.h>
#import "FilamentModule.h"
#import "FilamentInstaller.h"
#import <React/RCTBridge+Private.h>

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
