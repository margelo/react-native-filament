//
// Created by Marc Rousavy on 20.02.24.
//

#pragma once

#include "Listener.h"
#include "Surface.h"
#include <functional>
#include <memory>
#include <mutex>
#include <vector>

namespace margelo {

class SurfaceProvider {
public:
  using TOnCreate = std::function<void(std::shared_ptr<Surface> surface)>;
  using TOnResize = std::function<void(std::shared_ptr<Surface> surface, int width, int height)>;
  using TOnDestroy = std::function<void(std::shared_ptr<Surface>)>;

    struct Callback {
        TOnCreate onSurfaceCreated;
        TOnResize onSurfaceSizeChanged;
        TOnDestroy onSurfaceDestroyed;
    };

public:
  Listener addOnSurfaceChangedListener(Callback callback);

  virtual std::shared_ptr<Surface> getSurfaceOrNull() = 0;

protected:
  void onSurfaceCreated(std::shared_ptr<Surface> surface);
  void onSurfaceChanged(std::shared_ptr<Surface> surface, int width, int height);
  void onSurfaceDestroyed(std::shared_ptr<Surface> surface);

private:
  template <typename TListener> Listener addListenerToList(std::vector<TListener>& list, TListener listener);

private:
  std::vector<Callback> _callbacks;
  std::mutex _mutex;
};

} // namespace margelo
