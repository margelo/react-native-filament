//
//  FilamentView.h
//  Pods
//
//  Created by Marc Rousavy on 22.02.24.
//

#pragma once

#import <UIKit/UIKit.h>
#import <React/RCTViewManager.h>

NS_ASSUME_NONNULL_BEGIN

@interface FilamentMetalView : UIView

- (instancetype)init;

- (CAMetalLayer*)metalLayer;

- (void)layoutSubviews;

@property (nonatomic, strong) RCTDirectEventBlock onViewReady;

- (void)didMoveToWindow;

@end

NS_ASSUME_NONNULL_END
