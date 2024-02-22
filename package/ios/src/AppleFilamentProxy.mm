//
//  AppleFilamentProxy.mm
//  react-native-filament
//
//  Created by Marc Rousavy on 20.02.24.
//

#import "AppleFilamentProxy.h"
#import <Foundation/Foundation.h>

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

} // namespace margelo
