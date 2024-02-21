//
// Created by Marc Rousavy on 20.02.24.
//

#include "SurfaceProvider.h"

namespace margelo {

template<typename TListener>
Listener SurfaceProvider::addListenerToList(std::vector<TListener>& list, TListener listener) {
    std::unique_lock lock(_mutex);

    list.push_back(std::move(listener));
    size_t index = list.size();

    return Listener([weakThis = this, &list, index]() {
        if (weakThis != nullptr) {
            std::unique_lock lock(weakThis->_mutex);
            list.erase(list.begin() + index);
        }
    });
}

Listener SurfaceProvider::addOnSurfaceCreatedListener(SurfaceProvider::TOnCreate callback) {
    return addListenerToList(_onCreateListeners, callback);
}
Listener SurfaceProvider::addOnSurfaceChangedListener(SurfaceProvider::TOnChange callback) {
    return addListenerToList(_onChangeListeners, callback);
}
Listener SurfaceProvider::addOnSurfaceDestroyedListener(SurfaceProvider::TOnDestroy callback) {
    return addListenerToList(_onDestroyListeners, callback);
}

void SurfaceProvider::onSurfaceCreated(std::shared_ptr<Surface> surface) {
    std::unique_lock lock(_mutex);
    for (const auto& listener: _onCreateListeners) {
        listener(surface);
    }
}

void SurfaceProvider::onSurfaceChanged(std::shared_ptr<Surface> surface, int width, int height) {
    std::unique_lock lock(_mutex);
    for (const auto& listener: _onChangeListeners) {
        listener(surface, width, height);
    }
}

void SurfaceProvider::onSurfaceDestroyed(std::shared_ptr<Surface> surface) {
    std::unique_lock lock(_mutex);
    for (const auto& listener: _onDestroyListeners) {
        listener(surface);
    }
}

} // namespace margelo
