//
// Created by Hanno Gödecke on 15.05.24.
//

#pragma once

#include <utils/EntityManager.h>
#include <utils/NameComponentManager.h>

namespace margelo {

using namespace utils;

class GlobalNameComponentManager {
public:
  static void setGlobalNameComponentManager(NameComponentManager* manager);

  static NameComponentManager* getInstance();

private:
  static NameComponentManager* globalNameComponentManager;
};
} // namespace margelo
