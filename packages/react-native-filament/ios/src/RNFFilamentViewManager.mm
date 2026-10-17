#import "RNFFilamentMetalView.h"
#import <Foundation/Foundation.h>
#import <React/RCTUIManager.h>
#import <React/RCTViewManager.h>

@interface FilamentViewManager : RCTViewManager
@end

@implementation FilamentViewManager

RCT_EXPORT_VIEW_PROPERTY(onViewReady, RCTDirectEventBlock);
RCT_EXPORT_VIEW_PROPERTY(enableTransparentRendering, BOOL);

RCT_EXPORT_MODULE(FilamentView)

- (FilamentMetalView*)view {
  return [[FilamentMetalView alloc] init];
}

@end
