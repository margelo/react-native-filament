// This guard prevent this file to be compiled in the old architecture.
#ifdef RCT_NEW_ARCH_ENABLED
#import <React/RCTViewComponentView.h>
#import <UIKit/UIKit.h>

#ifndef FilamentViewNativeComponent_h
#define FilamentViewNativeComponent_h

NS_ASSUME_NONNULL_BEGIN

@interface FilamentView : RCTViewComponentView
@end

NS_ASSUME_NONNULL_END

#endif /* FilamentViewNativeComponent_h */
#endif /* RCT_NEW_ARCH_ENABLED */
