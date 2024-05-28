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
#ifdef RCT_NEW_ARCH_ENABLED
#import <React/RCTSurfacePresenter.h>
#endif

using namespace facebook;

@interface FilamentInstaller : NSObject

#ifdef RCT_NEW_ARCH_ENABLED
+ (BOOL)installToBridge:(jsi::Runtime*)runtime callInvoker:(std::shared_ptr<react::CallInvoker>)callInvoker surfacePresenter:(RCTSurfacePresenter*)surfacePresenter;
#else
+ (BOOL)installToBridge:(jsi::Runtime*)runtime callInvoker:(std::shared_ptr<react::CallInvoker>)callInvoker;
#endif

@end
