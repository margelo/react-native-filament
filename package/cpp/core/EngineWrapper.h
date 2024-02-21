//
// Created by Marc Rousavy on 21.02.24.
//

#pragma once

#include <filament/Engine.h>
#include <filament/SwapChain.h>
#include "Surface.h"
#include "SurfaceProvider.h"

namespace margelo {

using namespace filament;

class EngineWrapper {
public:
    explicit EngineWrapper(filament::Engine::Backend backend);
    ~EngineWrapper();

    void setSurfaceProvider(std::shared_ptr<SurfaceProvider> surfaceProvider);

private:
    void setSurface(std::shared_ptr<Surface> surface);
    void destroySurface();

private:
    Engine* _engine;
    SwapChain* _swapChain;
    std::shared_ptr<SurfaceProvider> _surfaceProvider;
    std::unique_ptr<Listener> _listener;
};

} // margelo
