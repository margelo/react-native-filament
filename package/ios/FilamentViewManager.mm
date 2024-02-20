#import "RCTBridge.h"
#import "Utils.h"
#import <React/RCTUIManager.h>
#import <React/RCTViewManager.h>

@interface FilamentViewManager : RCTViewManager
@end

@implementation FilamentViewManager

RCT_EXPORT_MODULE(FilamentView)

- (UIView*)view {
  return [[UIView alloc] init];
}

RCT_CUSTOM_VIEW_PROPERTY(color, NSString, UIView) {
  [view setBackgroundColor:[Utils hexStringToColor:json]];
}

@end
