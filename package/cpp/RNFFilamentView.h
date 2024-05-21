//
// Created by Marc Rousavy on 20.02.24.
//

#pragma once

#include <jsi/jsi.h>

#include "RNFChoreographerWrapper.h"
#include "RNFSurfaceProvider.h"
#include "jsi/RNFHybridObject.h"
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
  void setChoreographer(std::optional<std::shared_ptr<ChoreographerWrapper>> choreographerWrapperOrNull);

private:
  std::shared_ptr<Choreographer> _choreographer = nullptr;
  std::shared_ptr<Listener> _onSurfaceDestroyedListener = nullptr;
  static constexpr auto TAG = "FilamentView";
};
} // namespace margelo
