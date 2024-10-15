//
// Created by Hanno Gödecke on 16.05.24.
//

#pragma once

#include "core/utils/RNFEntityWrapper.h"
#include "jsi/RNFPointerHolder.h"
#include <utils/NameComponentManager.h>

namespace margelo {

using namespace utils;

class NameComponentManagerWrapper : public PointerHolder<NameComponentManager> {
public:
  explicit NameComponentManagerWrapper(std::shared_ptr<NameComponentManager> nameComponentManager)
      : PointerHolder(TAG, nameComponentManager) {}

  void loadHybridMethods() override;

  std::shared_ptr<NameComponentManager> getManager() {
    return pointee();
  }

private:
  static auto constexpr TAG = "NameComponentManagerWrapper";

private: // Exposed JS method
  std::optional<std::string> getEntityName(std::shared_ptr<EntityWrapper> entityWrapper);
};

} // namespace margelo
