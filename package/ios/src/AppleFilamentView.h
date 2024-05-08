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

/**
 * `AppleFilamentView` is the C++ wrapper around the `FilamentMetalView`.
 * FilamentView is a hybrid object which we can pass to JS, while `AppleFilamentView` is just a UIView,
 */
class AppleFilamentView : public FilamentView {
public:
  explicit AppleFilamentView(FilamentMetalView* view);

  std::shared_ptr<SurfaceProvider> getSurfaceProvider() override;

private:
  FilamentMetalView* _view;
  std::shared_ptr<MetalSurfaceProvider> _surfaceProvider;
};

} // namespace margelo
