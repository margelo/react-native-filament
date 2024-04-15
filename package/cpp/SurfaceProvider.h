//
// Created by Marc Rousavy on 20.02.24.
//

#pragma once

#include "Listener.h"
#include "ListenerManager.h"
#include "Surface.h"
#include "jsi/HybridObject.h"
#include <functional>
#include <memory>
#include <mutex>
#include <vector>

namespace margelo {

class SurfaceProvider : public HybridObject {
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
  explicit SurfaceProvider() : HybridObject("SurfaceProvider") {}

public:
  std::shared_ptr<Listener> addOnSurfaceChangedListener(Callback&& callback);

  virtual std::shared_ptr<Surface> getSurfaceOrNull() = 0;

  void loadHybridMethods() override;

protected:
  void onSurfaceCreated(std::shared_ptr<Surface> surface);
  void onSurfaceChanged(std::shared_ptr<Surface> surface, int width, int height);
  void onSurfaceDestroyed(std::shared_ptr<Surface> surface);

private:
  std::shared_ptr<ListenerManager<Callback>> _listeners = ListenerManager<Callback>::create();
  std::mutex _mutex;

private:
  static constexpr auto TAG = "SurfaceProvider";
};

} // namespace margelo
