//
//  AppleFilamentView.h
//  react-native-filament
//
//  Created by Marc Rousavy on 22.02.24.
//

#pragma once

#include "FilamentView.h"
#include "FilamentMetalView.h"
#include "SurfaceProvider.h"

namespace margelo {

class AppleFilamentView : public FilamentView {
public:
  explicit AppleFilamentView(FilamentMetalView* view): _view(view) {}
  
  std::shared_ptr<SurfaceProvider> getSurfaceProvider() override;
private:
  FilamentMetalView* _view;
};

} // namespace margelo
