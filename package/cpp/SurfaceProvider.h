//
// Created by Marc Rousavy on 20.02.24.
//

#pragma once

#include "Surface.h"
#include "Listener.h"
#include <memory>
#include <functional>
#include <vector>
#include <mutex>

namespace margelo {

class SurfaceProvider {
public:
    using TOnCreate = std::function<void(std::shared_ptr<Surface> surface)>;
    using TOnChange = std::function<void(std::shared_ptr<Surface> surface, int width, int height)>;
    using TOnDestroy = std::function<void(std::shared_ptr<Surface>)>;

public:
    Listener addOnSurfaceCreatedListener(TOnCreate callback);
    Listener addOnSurfaceChangedListener(TOnChange callback);
    Listener addOnSurfaceDestroyedListener(TOnDestroy callback);

    virtual std::shared_ptr<Surface> getSurfaceOrNull() = 0;

protected:
    void onSurfaceCreated(std::shared_ptr<Surface> surface);
    void onSurfaceChanged(std::shared_ptr<Surface> surface, int width, int height);
    void onSurfaceDestroyed(std::shared_ptr<Surface> surface);

private:
    template<typename TListener>
    Listener addListenerToList(std::vector<TListener>& list, TListener listener);

private:
    std::vector<TOnCreate> _onCreateListeners;
    std::vector<TOnChange> _onChangeListeners;
    std::vector<TOnDestroy> _onDestroyListeners;
    std::mutex _mutex;
};

} // namespace margelo
