#pragma once

#include <cstdint>
#include <variant>

namespace margelo::nitro::filament {

struct GrabBegin {
  float x;
  float y;
  bool strafe;
  uint64_t session;
};

struct GrabUpdate {
  float x;
  float y;
  uint64_t session;
};

struct GrabEnd {
  uint64_t session;
};

struct Scroll {
  float x;
  float y;
  float delta;
};

struct JumpToHome {};

using ManipulatorCommand = std::variant<GrabBegin, GrabUpdate, GrabEnd, Scroll, JumpToHome>;

} // namespace margelo::nitro::filament
