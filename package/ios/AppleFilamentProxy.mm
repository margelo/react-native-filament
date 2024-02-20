//
//  AppleFilamentProxy.mm
//  react-native-filament
//
//  Created by Marc Rousavy on 20.02.24.
//

#import <Foundation/Foundation.h>
#import "AppleFilamentProxy.h"

namespace margelo {
  
AppleFilamentProxy::AppleFilamentProxy(jsi::Runtime* runtime, std::shared_ptr<react::CallInvoker> callInvoker):
  _runtime(runtime), _callInvoker(callInvoker) { }
  
AppleFilamentProxy::~AppleFilamentProxy() {
  // TODO(hanno): cleanup here?
}
  
int AppleFilamentProxy::loadModel(const std::string &path) {
  // TODO(hanno): Implement model loading here
  return 13;
}
  
} // namespace margelo
