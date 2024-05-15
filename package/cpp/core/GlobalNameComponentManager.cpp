//
// Created by Hanno Gödecke on 15.05.24.
//

#include "GlobalNameComponentManager.h"

namespace margelo {
utils::NameComponentManager* GlobalNameComponentManager::globalNameComponentManager = nullptr;

void GlobalNameComponentManager::setGlobalNameComponentManager(utils::NameComponentManager* manager) {
  globalNameComponentManager = manager;
}

utils::NameComponentManager* GlobalNameComponentManager::getInstance() {
  return globalNameComponentManager;
}
} // namespace margelo
