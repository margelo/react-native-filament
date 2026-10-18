#pragma once

#include "threading/RenderThread.hpp"

#include <backend/CallbackHandler.h>

namespace margelo::nitro::filament {

class RenderThreadCallbackHandler final : public ::filament::backend::CallbackHandler {
public:
  explicit RenderThreadCallbackHandler(RenderThread& thread) : thread_(thread) {}

  void post(void* user, Callback callback) override {
    thread_.post({.run = [user, callback] { callback(user); }});
  }

private:
  RenderThread& thread_;
};

} // namespace margelo::nitro::filament
