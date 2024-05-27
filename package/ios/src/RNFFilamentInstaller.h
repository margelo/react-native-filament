//
//  IOSFilamentInstaller.h
//  react-native-filament
//
//  Created by Marc Rousavy on 20.02.24.
//

#pragma once

#import <Foundation/Foundation.h>
#import <React/RCTBridge.h>
#import <ReactCommon/CallInvoker.h>
#import <memory>
#import <jsi/jsi.h>

using namespace facebook;

@interface FilamentInstaller : NSObject

+ (BOOL)installToBridge:(jsi::Runtime*)runtime callInvoker:(std::shared_ptr<react::CallInvoker>)callInvoker;

@end
