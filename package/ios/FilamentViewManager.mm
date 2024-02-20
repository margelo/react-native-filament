#import "RCTBridge.h"
#import "Utils.h"
#import <React/RCTUIManager.h>
#import <React/RCTViewManager.h>
#import "FilamentInstaller.h"

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

RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(install) {
  // TODO: Figure out how to get jsi::Runtime and CallInvoker in bridge-less mode.
  BOOL result = [FilamentInstaller installToBridge:self.bridge];
  // TODO: Can we return a bool here instead? Or maybe even throw errors?
  return [NSNumber numberWithBool:result];
}

@end
