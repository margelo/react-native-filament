//
//  FilamentModule.h
//  Pods
//
//  Created by Marc Rousavy on 22.02.24.
//

#pragma once

#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface FilamentModule : NSObject <RCTBridgeModule>

@property (nonatomic, weak) RCTBridge *bridge;
@property (nonatomic, weak) RCTModuleRegistry *moduleRegistry;

@end

#ifdef RCT_NEW_ARCH_ENABLED
#import <rnfilament/rnfilament.h>

// TODO: Note, only available in RN 0.74 ?!
#import <React/RCTRuntimeExecutorModule.h>
#import <ReactCommon/RCTRuntimeExecutor.h>

@interface FilamentModule () <NativeFilamentModuleSpec, RCTRuntimeExecutorModule>
@end
#endif
