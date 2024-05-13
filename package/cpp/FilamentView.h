//
// Created by Marc Rousavy on 20.02.24.
//

#pragma once

#include <jsi/jsi.h>

#include "SurfaceProvider.h"
#include "jsi/HybridObject.h"
#include "ChoreographerWrapper.h"
#include <string>
#include <vector>

namespace margelo {

using namespace facebook;

class FilamentView : public HybridObject {
public:
  explicit FilamentView() : HybridObject("FilamentView") {}
    ~FilamentView() override;

public:
  virtual std::shared_ptr<SurfaceProvider> getSurfaceProvider() = 0;

  void loadHybridMethods() override;
    
private: // Exposed JS API
    void setChoreographer(std::shared_ptr<ChoreographerWrapper> choreographerWrapper);
    
private:
    std::shared_ptr<Choreographer> _choreographer = nullptr;
    static constexpr auto TAG = "FilamentView";
    
};
} // namespace margelo
