//
//  AppleFilamentProxy.h
//  react-native-filament
//
//  Created by Marc Rousavy on 20.02.24.
//  Copyright © 2023 mrousavy. All rights reserved.
//

#pragma once

#include "FilamentProxy.h"
#include "FilamentView.h"
#include <ReactCommon/CallInvoker.h>
#include <jsi/jsi.h>

namespace margelo {

class AppleFilamentProxy : public FilamentProxy {
public:
  explicit AppleFilamentProxy(jsi::Runtime* runtime, std::shared_ptr<react::CallInvoker> callInvoker);
  ~AppleFilamentProxy();

public:
  int loadModel(std::string path) override;
  std::shared_ptr<FilamentView> findFilamentView(int modelId) override;
  std::shared_ptr<Choreographer> createChoreographer() override;

private:
  jsi::Runtime* _runtime;
  std::shared_ptr<react::CallInvoker> _callInvoker;
};

} // namespace margelo
