//
// Created by Marc Rousavy on 20.02.24.
//

#pragma once

#include <jsi/jsi.h>

#include <core/EngineWrapper.h>
#include <future>
#include <string>
#include <vector>

#include "Choreographer.h"
#include "FilamentBuffer.h"
#include "FilamentView.h"
#include "jsi/HybridObject.h"
#include "test/TestHybridObject.h"
#include <ReactCommon/CallInvoker.h>
#include <jsi/jsi.h>
#include "Dispatcher.h"

namespace margelo {

using namespace facebook;

class FilamentProxy : public HybridObject {
public:
  explicit FilamentProxy() : HybridObject("FilamentProxy") {}

private:
  std::future<std::shared_ptr<FilamentBuffer>> loadAssetAsync(std::string path);
  virtual std::shared_ptr<FilamentBuffer> loadAsset(std::string path) = 0;
  virtual std::shared_ptr<FilamentView> findFilamentView(int id) = 0;
  virtual std::shared_ptr<Choreographer> createChoreographer() = 0;
  virtual std::shared_ptr<Dispatcher> getUIDispatcher() = 0;
  virtual std::shared_ptr<Dispatcher> getBackgroundDispatcher() = 0;

  // For testing
  std::shared_ptr<TestHybridObject> createTestObject();

  // Public API
  std::shared_ptr<EngineWrapper> createEngine();

 public:
  virtual jsi::Runtime& getRuntime() = 0;
  virtual std::shared_ptr<react::CallInvoker> getCallInvoker() = 0;

public:
  void loadHybridMethods() override;
};

} // namespace margelo
