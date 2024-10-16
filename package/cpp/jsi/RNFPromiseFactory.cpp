//
//  PromiseFactory.cpp
//  react-native-filament
//
//  Created by Marc Rousavy on 11.03.24.
//

#include "RNFPromiseFactory.h"
#include "RNFLogger.h"
#include "threading/RNFDispatcher.h"

namespace margelo {

jsi::Value PromiseFactory::createPromise(jsi::Runtime& runtime, RunPromise&& run) {
  std::shared_ptr<Dispatcher> dispatcher = Dispatcher::getRuntimeGlobalDispatcher(runtime);

  return Promise::createPromise(runtime, [dispatcher, run = std::move(run)](jsi::Runtime& runtime, std::shared_ptr<Promise> promise) {
    run(runtime, promise, dispatcher);
  });
}

} // namespace margelo
