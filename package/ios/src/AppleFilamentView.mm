//
//  AppleFilamentView.cpp
//  react-native-filament
//
//  Created by Marc Rousavy on 22.02.24.
//

#include "AppleFilamentView.h"
#include "MetalSurfaceProvider.h"

namespace margelo {

AppleFilamentView::AppleFilamentView(FilamentMetalView* view):
  _view(view), _surfaceProvider(std::make_shared<MetalSurfaceProvider>(view.metalLayer)) { }

std::shared_ptr<SurfaceProvider> AppleFilamentView::getSurfaceProvider() {
  return std::static_pointer_cast<SurfaceProvider>(_surfaceProvider);
}

}
