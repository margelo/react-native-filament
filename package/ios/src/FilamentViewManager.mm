#import <Foundation/Foundation.h>
#import <React/RCTViewManager.h>
#import "AppleFilamentView.h"

@interface FilamentViewManager : RCTViewManager
@end

@implementation FilamentViewManager

RCT_EXPORT_MODULE(FilamentView)

- (AppleFilamentView*)view {
  return [[AppleFilamentView alloc] init];
}

@end
