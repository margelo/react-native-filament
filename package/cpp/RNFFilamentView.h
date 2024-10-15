//
// Created by Marc Rousavy on 20.02.24.
//

#pragma once

#include <jsi/jsi.h>

#include "RNFChoreographerWrapper.h"
#include "RNFSurfaceProvider.h"
#if __has_include(<NitroModules/HybridObject.hpp>)
#include <NitroModules/HybridObject.hpp>
#else
#error NitroModules cannot be found! Are you sure you installed NitroModules properly?
#endif
#include <string>
#include <vector>

namespace margelo {

using namespace facebook;

class FilamentView : public nitro::HybridObject {
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
