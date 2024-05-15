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
      : HybridObject("AnimatorWrapper"), _animator(animator), _instance(instance), _entityMap(getEntityNameMap(instance)) {}

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
  /**
   * Creates a map of entities and their names
   */
  EntityNameMap getEntityNameMap(FilamentInstance* instance);
  /**
   * Will take all entities associates with this animator instance and apply it to the provided entities
   */
  void applyAnimationTo(EntityNameMap entitiesNameMap);
  /**
   * Loops through all instances in the sync list and applies the current transform of all entities to the instance
   * using `applyAnimationTo`, then updates the bone matrices of the instance using `instanceAnimator->updateBoneMatrices`.
   */
  void syncInstances();

  TransformManager& getTransformManager();

protected:
  std::mutex _mutex;
  Animator* _animator;
  FilamentInstance* _instance;
  // The entity map of this class's FilamentInstance
  EntityNameMap _entityMap;
  int _syncId = 0;
  std::map<int, FilamentInstance*> _syncMap;
  std::map<int, EntityNameMap> _instanceEntityMap;
  TransformManager& _transformManager = getTransformManager();

private:
  static auto constexpr TAG = "AnimatorWrapper";
};

} // namespace margelo
