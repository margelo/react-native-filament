#pragma once

#include "EngineBackend.hpp"
#include "FrameListeners.hpp"
#include "RenderMode.hpp"
#include "RenderThreadCallbackHandler.hpp"
#include "assets/GltfLoader.hpp"
#include "assets/ModelLoads.hpp"
#include "materials/MaterialAssignments.hpp"
#include "materials/TextureDecoder.hpp"
#include "resources/ResourceRoot.hpp"
#include "resources/Users.hpp"
#include "threading/RenderThread.hpp"
#include "utils/WeakRegistry.hpp"

#include <NitroModules/Promise.hpp>
#include <filament/Engine.h>
#include <worklets/SharedItems/Serializable.h>
#include <worklets/WorkletRuntime/WorkletRuntime.h>

#include <atomic>
#include <exception>
#include <functional>
#include <memory>
#include <mutex>
#include <vector>

namespace margelo::nitro::filament {

class AnimationPlayerCore;
class ManipulatorCore;
class SceneCore;
class SkeletonFollower;
class TransformBindingCore;
class ViewTargetCore;

class EngineCore final : public std::enable_shared_from_this<EngineCore> {
public:
  using StartedHandler = std::function<void(const std::shared_ptr<EngineCore>& core, std::exception_ptr error)>;

  static std::shared_ptr<EngineCore> create(EngineBackend backend, StartedHandler onStarted);

  EngineBackend backend() const;
  RenderThread& thread();
  RenderThreadCallbackHandler& callbacks();
  ::filament::Engine& engine();
  bool isLive() const;

  RenderMode renderMode() const;
  void setRenderMode(RenderMode mode);
  void requestFrame();
  void scheduleDemandUpdate();
  void updateDemand();

  void adopt(const std::shared_ptr<Resource>& resource);
  void dispose(const std::shared_ptr<Resource>& resource);

  GltfLoader& gltf();
  void startModelLoad(::filament::gltfio::FilamentAsset* asset, ModelLoad::Completion completion);
  void addAnimationPlayer(const std::shared_ptr<AnimationPlayerCore>& player);
  void addTransformBinding(const std::shared_ptr<TransformBindingCore>& binding);
  void addManipulator(const std::shared_ptr<ManipulatorCore>& manipulator);
  void addSkeletonFollower(const std::shared_ptr<SkeletonFollower>& follower);
  Users<SceneCore>& scenes();
  MaterialAssignments& materialAssignments();
  void decodeTexture(const uint8_t* bytes, size_t size, bool srgb, TextureDecoder::Completion completion);

  void addTarget(std::shared_ptr<ViewTargetCore> target);
  void removeTarget(const std::shared_ptr<ViewTargetCore>& target);

  void bindRuntime(std::shared_ptr<worklets::WorkletRuntime> runtime);
  bool hasRuntime() const;
  void runWorklet(const std::shared_ptr<worklets::SerializableWorklet>& worklet);

  std::shared_ptr<FrameListener> addFrameListener(std::function<bool(const FrameInfo&)> callback);
  void removeFrameListener(const std::shared_ptr<FrameListener>& listener);

  std::shared_ptr<Promise<void>> shutdown();

private:
  explicit EngineCore(EngineBackend backend);
  std::shared_ptr<worklets::WorkletRuntime> runtime() const;
  bool canRenderAnyTarget() const;
  FrameInfo nextFrameInfo(int64_t frameTimeNanos);
  void renderFrame(int64_t frameTimeNanos);
  void shutdownOnRenderThread();

  const EngineBackend backend_;
  std::unique_ptr<RenderThread> thread_;
  std::unique_ptr<RenderThreadCallbackHandler> callbacks_;
  ::filament::Engine* engine_ = nullptr;
  std::shared_ptr<ResourceRoot> resources_ = std::make_shared<ResourceRoot>();
  std::unique_ptr<GltfLoader> gltf_;
  ModelLoads loads_;
  std::unique_ptr<TextureDecoder> textures_;
  MaterialAssignments materialAssignments_;
  WeakRegistry<AnimationPlayerCore> players_;
  WeakRegistry<TransformBindingCore> transformBindings_;
  WeakRegistry<ManipulatorCore> manipulators_;
  WeakRegistry<SkeletonFollower> skeletonFollowers_;
  Users<SceneCore> scenes_;
  std::vector<std::shared_ptr<ViewTargetCore>> targets_;
  FrameListeners frameListeners_;
  bool listenersWantFrame_ = false;
  bool playersWantFrame_ = false;
  bool vsyncEnabled_ = false;
  int64_t lastFrameTimeNanos_ = 0;
  double elapsedSeconds_ = 0;
  double frameIndex_ = 0;
  std::atomic<RenderMode> renderMode_{RenderMode::CONTINUOUS};
  std::atomic<bool> frameRequested_{false};
  std::atomic<bool> demandUpdatePending_{false};
  std::atomic<bool> live_{true};
  mutable std::mutex runtimeMutex_;
  std::shared_ptr<worklets::WorkletRuntime> runtime_;
  std::mutex shutdownMutex_;
  std::shared_ptr<Promise<void>> shutdownPromise_;
};

} // namespace margelo::nitro::filament
