#import "FilamentMetalView.h"
#import <Foundation/Foundation.h>
#import <React/RCTViewManager.h>

@interface FilamentViewManager : RCTViewManager
@end

@implementation FilamentViewManager

RCT_EXPORT_MODULE(FilamentView)

- (FilamentMetalView*)view {
  return [[FilamentMetalView alloc] init];
}

@end
