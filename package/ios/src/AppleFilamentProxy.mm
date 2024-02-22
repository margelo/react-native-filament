//
//  AppleFilamentProxy.mm
//  react-native-filament
//
//  Created by Marc Rousavy on 20.02.24.
//

#import "AppleFilamentProxy.h"
#import <Foundation/Foundation.h>
#import <React/RCTUtils.h>
#import <React/RCTBridge.h>
#import <React/RCTBridge+Private.h>
#import <React/RCTUIManager.h>
#import "FilamentView.h"
#import "AppleFilamentView.h"

namespace margelo {

AppleFilamentProxy::AppleFilamentProxy(jsi::Runtime* runtime, std::shared_ptr<react::CallInvoker> callInvoker)
    : _runtime(runtime), _callInvoker(callInvoker) {}

AppleFilamentProxy::~AppleFilamentProxy() {
  // TODO(hanno): cleanup here?
}

int AppleFilamentProxy::loadModel(std::string path) {
  // TODO(hanno): Implement model loading here
  return 13;
}

std::shared_ptr<FilamentView> AppleFilamentProxy::findFilamentView(int viewId) {
  // TODO(marc): Make this async when JSIConvert can do that
  RCTUnsafeExecuteOnMainQueueSync(^{
    RCTBridge* currentBridge = [RCTBridge currentBridge]; // <-- from <React/RCTBridge+Private.h>
    RCTUIManager* uiManager = currentBridge.uiManager; // <-- from <React/RCTUIManager.h>
    UIView* anonymousView = [uiManager viewForReactTag:[NSNumber numberWithInt:viewId]];
    AppleFilamentView* view = (AppleFilamentView*) anonymousView;
    // TODO: Somehow convert the Objective-C type "AppleFilamentView" to a C++ type "FilamentView"
  });
  return nullptr;
}


} // namespace margelo
