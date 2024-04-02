//
//  AppleFilamentView.h
//  react-native-filament
//
//  Created by Marc Rousavy on 22.02.24.
//

#pragma once

#include "FilamentMetalView.h"
#include "FilamentView.h"
#include "MetalSurfaceProvider.h"
#include "SurfaceProvider.h"

namespace margelo {

class AppleFilamentView : public FilamentView {
public:
  explicit AppleFilamentView(FilamentMetalView* view);

  std::shared_ptr<SurfaceProvider> getSurfaceProvider() override;

private:
  FilamentMetalView* _view;
  std::shared_ptr<MetalSurfaceProvider> _surfaceProvider;
};

} // namespace margelo
