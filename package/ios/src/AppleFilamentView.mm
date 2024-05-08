//
//  AppleFilamentView.cpp
//  react-native-filament
//
//  Created by Marc Rousavy on 22.02.24.
//

#include "AppleFilamentView.h"
#include "MetalSurfaceProvider.h"

namespace margelo {

AppleFilamentView::AppleFilamentView(FilamentMetalView* view, std::shared_ptr<Dispatcher> jsDispatcher)
    : _view(view), _surfaceProvider(std::make_shared<MetalSurfaceProvider>(view.metalLayer, jsDispatcher)) {}

std::shared_ptr<SurfaceProvider> AppleFilamentView::getSurfaceProvider() {
  return _surfaceProvider;
}

} // namespace margelo
