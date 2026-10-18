#pragma once

#include "utils/Trs.hpp"

#include <filament/TransformManager.h>
#include <utils/Entity.h>

#include <atomic>
#include <mutex>

namespace margelo::nitro::filament {

class TransformBindingCore final {
public:
  TransformBindingCore(utils::Entity entity, Trs initial);

  void setTranslation(::filament::math::float3 translation);
  void setRotation(::filament::math::quatf rotation);
  void setScale(::filament::math::float3 scale);
  void setBase(const ::filament::math::mat4f& base);
  void apply(::filament::TransformManager& transforms);
  void stop();
  bool isStopped() const;

private:
  template <typename Update> void write(Update&& update);

  const utils::Entity entity_;
  std::mutex mutex_;
  Trs latest_;
  ::filament::math::mat4f base_;
  std::atomic<bool> dirty_{false};
  std::atomic<bool> stopped_{false};
};

} // namespace margelo::nitro::filament
