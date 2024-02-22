//
//  IOSFilamentInstaller.h
//  react-native-filament
//
//  Created by Marc Rousavy on 20.02.24.
//

#pragma once

#import <Foundation/Foundation.h>
#import <React/RCTBridge.h>

@interface FilamentInstaller : NSObject

+ (BOOL)installToBridge:(RCTBridge*)bridge;

@end
