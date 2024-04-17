//
// Created by Marc Rousavy on 21.02.24.
//

#include "EngineWrapper.h"

#include "References.h"
#include "utils/Converter.h"

#include <filament/Color.h>
#include <filament/Engine.h>
#include <filament/Fence.h>
#include <filament/IndirectLight.h>
#include <filament/LightManager.h>
#include <filament/RenderableManager.h>
#include <filament/SwapChain.h>
#include <filament/TransformManager.h>
#include <utils/Entity.h>
#include <utils/EntityManager.h>

#include <gltfio/Animator.h>
#include <gltfio/MaterialProvider.h>
#include <gltfio/materials/uberarchive.h>

#include <ktxreader/Ktx1Reader.h>

#include <unistd.h>
#include <utility>

namespace margelo {

void EngineWrapper::loadHybridMethods() {
  registerHybridMethod("setSurfaceProvider", &EngineWrapper::setSurfaceProvider, this);
  registerHybridMethod("setRenderCallback", &EngineWrapper::setRenderCallback, this);
  registerHybridMethod("setIndirectLight", &EngineWrapper::setIndirectLight, this);

  registerHybridMethod("loadAsset", &EngineWrapper::loadAsset, this);
  registerHybridMethod("loadInstancedAsset", &EngineWrapper::loadInstancedAsset, this);

  // Filament API:
  registerHybridMethod("getScene", &EngineWrapper::getScene, this);
  registerHybridMethod("getView", &EngineWrapper::getView, this);
  registerHybridMethod("getCamera", &EngineWrapper::getCamera, this);
  registerHybridMethod("getCameraManipulator", &EngineWrapper::getCameraManipulator, this);
  registerHybridMethod("transformToUnitCube", &EngineWrapper::transformToUnitCube, this);
  registerHybridMethod("setEntityPosition", &EngineWrapper::setEntityPosition, this);
  registerHybridMethod("setEntityRotation", &EngineWrapper::setEntityRotation, this);
  registerHybridMethod("setEntityScale", &EngineWrapper::setEntityScale, this);
  registerHybridMethod("setIsPaused", &EngineWrapper::setIsPaused, this);
  registerHybridMethod("getTransformManager", &EngineWrapper::getTransformManager, this);
  registerHybridMethod("createRenderableManager", &EngineWrapper::createRenderableManager, this);
  registerHybridMethod("createMaterial", &EngineWrapper::createMaterial, this);
  registerHybridMethod("createLightManager", &EngineWrapper::createLightManager, this);

  // Combined Physics API:
  registerHybridMethod("updateTransformByRigidBody", &EngineWrapper::updateTransformByRigidBody, this);
}
void EngineWrapper::setSurfaceProvider(std::shared_ptr<SurfaceProvider> surfaceProvider) {
  pointee()->setSurfaceProvider(surfaceProvider);
}
void EngineWrapper::setRenderCallback(std::optional<RenderCallback> callback) {
  pointee()->setRenderCallback(callback);
}
void EngineWrapper::setIndirectLight(std::shared_ptr<FilamentBuffer> modelBuffer, std::optional<double> intensity,
                                     std::optional<int> irradianceBands) {
  pointee()->setIndirectLight(modelBuffer, intensity, irradianceBands);
}
std::shared_ptr<FilamentAssetWrapper> EngineWrapper::loadAsset(std::shared_ptr<FilamentBuffer> modelBuffer) {
  return pointee()->loadAsset(modelBuffer);
}
std::shared_ptr<FilamentAssetWrapper> EngineWrapper::loadInstancedAsset(std::shared_ptr<FilamentBuffer> modelBuffer, int instanceCount) {
  return pointee()->loadInstancedAsset(modelBuffer, instanceCount);
}
std::shared_ptr<SceneWrapper> EngineWrapper::getScene() {
  return pointee()->getScene();
}
std::shared_ptr<ViewWrapper> EngineWrapper::getView() {
  return pointee()->getView();
}
std::shared_ptr<CameraWrapper> EngineWrapper::getCamera() {
  return pointee()->getCamera();
}
std::shared_ptr<ManipulatorWrapper> EngineWrapper::getCameraManipulator() {
  return pointee()->getCameraManipulator();
}
std::shared_ptr<TransformManagerWrapper> EngineWrapper::getTransformManager() {
  return pointee()->getTransformManager();
}
std::shared_ptr<LightManagerWrapper> EngineWrapper::createLightManager() {
  return pointee()->createLightManager();
}

// TODO: Those transform methods should me moved and handled by the transform manager!
void EngineWrapper::setEntityPosition(std::shared_ptr<EntityWrapper> entity, std::vector<double> positionVec, bool multiplyCurrent) {
  pointee()->setEntityPosition(entity, positionVec, multiplyCurrent);
}
void EngineWrapper::setEntityRotation(std::shared_ptr<EntityWrapper> entity, double angleRadians, std::vector<double> axisVec,
                                      bool multiplyCurrent) {
  pointee()->setEntityRotation(entity, angleRadians, axisVec, multiplyCurrent);
}
void EngineWrapper::setEntityScale(std::shared_ptr<EntityWrapper> entity, std::vector<double> scaleVec, bool multiplyCurrent) {
  pointee()->setEntityScale(entity, scaleVec, multiplyCurrent);
}
void EngineWrapper::updateTransformByRigidBody(std::shared_ptr<EntityWrapper> entityWrapper, std::shared_ptr<RigidBodyWrapper> rigidBody) {
  pointee()->updateTransformByRigidBody(entityWrapper, rigidBody);
}
void EngineWrapper::transformToUnitCube(std::shared_ptr<FilamentAssetWrapper> asset) {
  pointee()->transformToUnitCube(asset);
}

void EngineWrapper::setIsPaused(bool isPaused) {
  pointee()->setIsPaused(isPaused);
}
std::shared_ptr<RenderableManagerWrapper> EngineWrapper::createRenderableManager() {
  return pointee()->createRenderableManager();
}
std::shared_ptr<MaterialWrapper> EngineWrapper::createMaterial(std::shared_ptr<FilamentBuffer> materialBuffer) {
  return pointee()->createMaterial(materialBuffer);
}

} // namespace margelo
