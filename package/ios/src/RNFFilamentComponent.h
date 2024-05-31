//
//  RNFFilamentView.h
//  react-native-filament
//
//  Created by Hanno Gödecke on 27.05.24.
//

#pragma once

// This guard prevent this file to be compiled in the old architecture.
#ifdef RCT_NEW_ARCH_ENABLED
#import <React/RCTViewComponentView.h>
#import <UIKit/UIKit.h>
#import "RNFFilamentMetalView.h"

NS_ASSUME_NONNULL_BEGIN

// This is the View component used by Fabric
@interface FilamentComponent : RCTViewComponentView
- (FilamentMetalView *)filamentMetalView;
@end

NS_ASSUME_NONNULL_END

#endif /* RCT_NEW_ARCH_ENABLED */
