//
// Created by Hanno Gödecke on 05.03.24.
//

#pragma once

#include "jsi/EnumMapper.h"
#include "BulletCollision/CollisionDispatch/btCollisionObject.h"

namespace margelo {

enum class ActivationState : int {
  STATE_ACTIVE_TAG = ACTIVE_TAG,
  STATE_ISLAND_SLEEPING = ISLAND_SLEEPING,
  STATE_WANTS_DEACTIVATION = WANTS_DEACTIVATION,
  STATE_DISABLE_DEACTIVATION = DISABLE_DEACTIVATION,
  STATE_DISABLE_SIMULATION = DISABLE_SIMULATION,
  STATE_FIXED_BASE_MULTI_BODY = FIXED_BASE_MULTI_BODY
};

  namespace EnumMapper {
    static void convertJSUnionToEnum(const std::string& inUnion, ActivationState* outEnum) {
      if (inUnion == "active_state")
        *outEnum = ActivationState::STATE_ACTIVE_TAG;
      else if (inUnion == "island_sleeping")
        *outEnum = ActivationState::STATE_ISLAND_SLEEPING;
      else if (inUnion == "wants_deactivation")
        *outEnum = ActivationState::STATE_WANTS_DEACTIVATION;
      else if (inUnion == "disable_deactivation")
        *outEnum = ActivationState::STATE_DISABLE_DEACTIVATION;
      else if (inUnion == "disable_simulation")
        *outEnum = ActivationState::STATE_DISABLE_SIMULATION;
      else if (inUnion == "fixed_base_multi_body")
        *outEnum = ActivationState::STATE_FIXED_BASE_MULTI_BODY;
      else
        throw invalidUnion(inUnion);
    }

    static void convertEnumToJSUnion(ActivationState inEnum, std::string* outUnion) {
      switch (inEnum) {
        case ActivationState::STATE_ACTIVE_TAG:
          *outUnion = "active_state";
          break;
        case ActivationState::STATE_ISLAND_SLEEPING:
          *outUnion = "island_sleeping";
          break;
        case ActivationState::STATE_WANTS_DEACTIVATION:
          *outUnion = "wants_deactivation";
          break;
        case ActivationState::STATE_DISABLE_DEACTIVATION:
          *outUnion = "disable_deactivation";
          break;
        case ActivationState::STATE_DISABLE_SIMULATION:
          *outUnion = "disable_simulation";
          break;
        case ActivationState::STATE_FIXED_BASE_MULTI_BODY:
          *outUnion = "fixed_base_multi_body";
          break;
        default:
          throw invalidEnum(inEnum);
      }
    }
}

}
