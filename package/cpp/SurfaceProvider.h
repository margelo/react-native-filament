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
  Listener addOnSurfaceChangedListener(Callback callback);

  virtual std::shared_ptr<Surface> getSurfaceOrNull() = 0;

  void loadHybridMethods() override;

protected:
  void onSurfaceCreated(std::shared_ptr<Surface> surface);
  void onSurfaceChanged(std::shared_ptr<Surface> surface, int width, int height);
  void onSurfaceDestroyed(std::shared_ptr<Surface> surface);

private:
  ListenerManager<Callback> _listeners;
  std::mutex _mutex;

private:
  static constexpr auto TAG = "SurfaceProvider";
  const char* getName() override { return TAG; }
};

} // namespace margelo
