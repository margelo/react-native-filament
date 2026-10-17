#pragma once

#include "ViewTargetCore.hpp"

#include <filament/View.h>

#include <cstdint>
#include <memory>
#include <vector>

namespace margelo::nitro::filament {

struct PickTicket {
  std::weak_ptr<ViewTargetCore> target;
  uint64_t id;

  void onResult(const ::filament::View::PickingQueryResult& result) {
    if (std::shared_ptr<ViewTargetCore> owner = target.lock()) {
      owner->completePick(id, result);
    }
    delete this;
  }
};

struct SnapshotTicket {
  std::weak_ptr<ViewTargetCore> target;
  uint64_t id;
  uint32_t width;
  uint32_t height;
  std::vector<uint8_t> pixels;

  static void onRead(void*, size_t, void* user) {
    std::unique_ptr<SnapshotTicket> ticket(static_cast<SnapshotTicket*>(user));
    if (std::shared_ptr<ViewTargetCore> owner = ticket->target.lock()) {
      owner->completeSnapshot(ticket->id, std::move(ticket->pixels), ticket->width, ticket->height);
    }
  }
};

} // namespace margelo::nitro::filament
