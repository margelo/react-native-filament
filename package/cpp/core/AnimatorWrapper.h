//
// Created by Hanno Gödecke on 29.02.24.
//

#pragma once

#include "FilamentAssetWrapper.h"
#include "FilamentInstanceWrapper.h"
#include "jsi/HybridObject.h"
#include <gltfio/Animator.h>

#include <map>

namespace margelo {

using namespace filament::gltfio;
using EntityNameMap = std::map<std::string, Entity>;

class AnimatorWrapper : public HybridObject {
public:
  explicit AnimatorWrapper(Animator* animator, FilamentInstance* instance)
      : HybridObject("AnimatorWrapper"), _animator(animator), _instance(instance) {}

  void loadHybridMethods() override;

private: // Exposed JS API
  void applyAnimation(int animationIndex, double time);
  void applyCrossFade(int previousAnimationIndex, double previousAnimationTime, double alpha);
  void updateBoneMatrices();
  void resetBoneMatrices();
  int getAnimationCount();
  double getAnimationDuration(int animationIndex);
  std::string getAnimationName(int animationIndex);
  int addToSyncList(std::shared_ptr<FilamentInstanceWrapper> instanceWrapper);
  void removeFromSyncList(int instanceId);

private: // Internal
  // Creates a map of entities and their names
  EntityNameMap getEntityNameMap(FilamentInstance* instance);
  void applyAnimationToEntities(EntityNameMap entitiesToSync);

protected:
  std::mutex _mutex;
  Animator* _animator;
  FilamentInstance* _instance;
  int _syncId = 0;
  std::map<int, FilamentInstance*> _syncMap;
  std::map<int, EntityNameMap> _instanceEntityMap;

private:
  static auto constexpr TAG = "AnimatorWrapper";
};

} // namespace margelo
