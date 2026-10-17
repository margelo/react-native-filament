//
//  FilamentView.h
//  Pods
//
//  Created by Marc Rousavy on 22.02.24.
//

#pragma once

#import <React/RCTViewManager.h>
#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * This is the actual UIView component that will be part of the view hierarchy.
 */
@interface FilamentMetalView : UIView

- (instancetype)init;

- (CAMetalLayer*)metalLayer;

- (void)layoutSubviews;

@property(nonatomic, strong) RCTDirectEventBlock onViewReady;
@property(nonatomic, assign) BOOL enableTransparentRendering;

- (void)didMoveToWindow;

@end

NS_ASSUME_NONNULL_END
