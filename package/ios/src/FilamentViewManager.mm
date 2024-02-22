#import <Foundation/Foundation.h>
#import <React/RCTViewManager.h>
#import "FilamentMetalView.h"

@interface FilamentViewManager : RCTViewManager
@end

@implementation FilamentViewManager

RCT_EXPORT_MODULE(FilamentMetalView)

- (FilamentMetalView*)view {
  return [[FilamentMetalView alloc] init];
}

@end
