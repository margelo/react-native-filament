//
// Created by Marc Rousavy on 20.02.24.
//

#pragma once

#include <jsi/jsi.h>

#include <core/EngineWrapper.h>
#include <string>
#include <vector>

#include "Choreographer.h"
#include "FilamentBuffer.h"
#include "FilamentView.h"
#include "jsi/HybridObject.h"
#include "test/TestHybridObject.h"

namespace margelo {

using namespace facebook;

class FilamentProxy : public HybridObject {
private:
  virtual std::shared_ptr<FilamentBuffer> loadModel(std::string path) = 0;
  virtual std::shared_ptr<FilamentView> findFilamentView(int id) = 0;
  virtual std::shared_ptr<Choreographer> createChoreographer() = 0;

  // For testing
  std::shared_ptr<TestHybridObject> createTestObject();

  // Public API
  std::shared_ptr<EngineWrapper> createEngine();

public:
  void loadHybridMethods() override;
};

} // namespace margelo
