#include "EngineCore.hpp"

#include "BackendConversion.hpp"
#include "RenderRuntimeDispatcher.hpp"
#include "assets/AnimationPlayerCore.hpp"
#include "assets/SkeletonFollower.hpp"
#include "control/ManipulatorCore.hpp"
#include "control/TransformBindingCore.hpp"
#include "physics/PhysicsWorldCore.hpp"
#include "targets/ViewTargetCore.hpp"
#include "threading/WorkerPool.hpp"
#include "utils/Logger.hpp"

#include <algorithm>
#include <stdexcept>

namespace margelo::nitro::filament {

std::shared_ptr<EngineCore> EngineCore::create(EngineBackend backend, StartedHandler onStarted) {
  std::shared_ptr<EngineCore> core(new EngineCore(backend));
  core->thread_ = std::make_unique<RenderThread>([raw = core.get()](int64_t frameTimeNanos) { raw->renderFrame(frameTimeNanos); });
  core->callbacks_ = std::make_unique<RenderThreadCallbackHandler>(*core->thread_);
  core->thread_->post({
      .run =
          [core, onStarted] {
            core->engine_ = ::filament::Engine::Builder().backend(toFilamentBackend(core->backend_)).build();
            if (core->engine_ == nullptr) {
              onStarted(core, std::make_exception_ptr(
                                  std::runtime_error("Filament could not create an Engine for this backend on this device.")));
              core->shutdown();
              return;
            }
            onStarted(core, nullptr);
          },
      .cancel =
          [core, onStarted] {
            onStarted(core, std::make_exception_ptr(std::runtime_error("The Engine was shut down before it started.")));
          },
  });
  return core;
}

EngineCore::EngineCore(EngineBackend backend) : backend_(backend) {}

EngineBackend EngineCore::backend() const {
  return backend_;
}

RenderThread& EngineCore::thread() {
  return *thread_;
}

RenderThreadCallbackHandler& EngineCore::callbacks() {
  return *callbacks_;
}

::filament::Engine& EngineCore::engine() {
  return *engine_;
}

bool EngineCore::isLive() const {
  return live_;
}

RenderMode EngineCore::renderMode() const {
  return renderMode_;
}

void EngineCore::setRenderMode(RenderMode mode) {
  renderMode_ = mode;
  scheduleDemandUpdate();
}

void EngineCore::requestFrame() {
  frameRequested_ = true;
  scheduleDemandUpdate();
}

void EngineCore::scheduleDemandUpdate() {
  if (demandUpdatePending_.exchange(true)) {
    return;
  }
  thread_->post({.run = [self = shared_from_this()] {
    self->demandUpdatePending_ = false;
    self->updateDemand();
  }});
}

void EngineCore::updateDemand() {
  bool wantsFrame =
      renderMode_ == RenderMode::CONTINUOUS || frameRequested_ || listenersWantFrame_ || playersWantFrame_ || physicsWantsFrame_;
  bool uploading = !loads_.empty() || (textures_ != nullptr && !textures_->empty());
  bool enabled = (!recording_ && canRenderAnyTarget() && wantsFrame) || uploading;
  if (!enabled) {
    lastFrameTimeNanos_ = 0;
  }
  if (enabled != vsyncEnabled_) {
    vsyncEnabled_ = enabled;
    thread_->setVsyncEnabled(enabled);
  }
}

void EngineCore::adopt(const std::shared_ptr<Resource>& resource) {
  resources_->adopt(resource);
}

void EngineCore::dispose(const std::shared_ptr<Resource>& resource) {
  if (!resource->markDisposing()) {
    return;
  }
  thread_->post({.run = [resource] { resource->destroyTree(); }});
}

GltfLoader& EngineCore::gltf() {
  if (gltf_ == nullptr) {
    gltf_ = std::make_unique<GltfLoader>(*engine_);
  }
  return *gltf_;
}

void EngineCore::startModelLoad(::filament::gltfio::FilamentAsset* asset, ModelLoad::Completion completion) {
  loads_.start(std::make_unique<ModelLoad>(*engine_, gltf().assetLoader(), asset,
                                           [self = shared_from_this(), completion](auto* loaded, std::exception_ptr error) {
                                             self->frameRequested_ = true;
                                             completion(loaded, std::move(error));
                                           }));
  updateDemand();
}

void EngineCore::addAnimationPlayer(const std::shared_ptr<AnimationPlayerCore>& player) {
  players_.add(player);
}

void EngineCore::addTransformBinding(const std::shared_ptr<TransformBindingCore>& binding) {
  transformBindings_.add(binding);
}

void EngineCore::addManipulator(const std::shared_ptr<ManipulatorCore>& manipulator) {
  manipulators_.add(manipulator);
}

void EngineCore::addSkeletonFollower(const std::shared_ptr<SkeletonFollower>& follower) {
  skeletonFollowers_.add(follower);
}

void EngineCore::addPhysicsWorld(const std::shared_ptr<PhysicsWorldCore>& world) {
  physicsWorlds_.add(world);
}

MaterialAssignments& EngineCore::materialAssignments() {
  return materialAssignments_;
}

void EngineCore::decodeTexture(const uint8_t* bytes, size_t size, bool srgb, TextureDecoder::Completion completion) {
  if (textures_ == nullptr) {
    textures_ = std::make_unique<TextureDecoder>(*engine_);
  }
  textures_->push(bytes, size, srgb, [self = shared_from_this(), completion](::filament::Texture* texture, std::exception_ptr error) {
    self->frameRequested_ = true;
    completion(texture, std::move(error));
  });
  updateDemand();
}

Users<SceneCore>& EngineCore::scenes() {
  return scenes_;
}

void EngineCore::addTarget(std::shared_ptr<ViewTargetCore> target) {
  targets_.push_back(std::move(target));
}

void EngineCore::removeTarget(const std::shared_ptr<ViewTargetCore>& target) {
  std::erase(targets_, target);
  updateDemand();
}

void EngineCore::bindRuntime(std::shared_ptr<worklets::WorkletRuntime> runtime) {
  {
    std::unique_lock lock(runtimeMutex_);
    if (runtime_ != nullptr) {
      throw std::runtime_error("This Engine's render thread already has a worklet runtime.");
    }
    runtime_ = runtime;
  }
  auto dispatcher = std::make_shared<RenderRuntimeDispatcher>(weak_from_this(), runtime);
  runtime->runSync([&](jsi::Runtime& rt) { Dispatcher::installRuntimeGlobalDispatcher(rt, dispatcher); });
}

bool EngineCore::hasRuntime() const {
  return runtime() != nullptr;
}

std::shared_ptr<worklets::WorkletRuntime> EngineCore::runtime() const {
  std::unique_lock lock(runtimeMutex_);
  return runtime_;
}

void EngineCore::runWorklet(const std::shared_ptr<worklets::SerializableWorklet>& worklet) {
  std::shared_ptr<worklets::WorkletRuntime> runtime = this->runtime();
  try {
    runtime->runSync([&](jsi::Runtime& rt) { worklet->toJSValue(rt).asObject(rt).asFunction(rt).call(rt); });
  } catch (const std::exception& error) {
    logError(std::string("A render thread worklet threw: ") + error.what());
  }
}

std::shared_ptr<FrameListener> EngineCore::addFrameListener(std::function<bool(const FrameInfo&)> callback) {
  std::shared_ptr<FrameListener> listener = frameListeners_.add(std::move(callback));
  listenersWantFrame_ = true;
  updateDemand();
  return listener;
}

void EngineCore::removeFrameListener(const std::shared_ptr<FrameListener>& listener) {
  if (std::shared_ptr<worklets::WorkletRuntime> runtime = this->runtime()) {
    runtime->runSync([&](jsi::Runtime&) { frameListeners_.remove(listener); });
  } else {
    frameListeners_.remove(listener);
  }
  if (frameListeners_.empty()) {
    listenersWantFrame_ = false;
    updateDemand();
  }
}

bool EngineCore::canRenderAnyTarget() const {
  return std::any_of(targets_.begin(), targets_.end(), [](const std::shared_ptr<ViewTargetCore>& target) { return target->canRender(); });
}

FrameInfo EngineCore::nextFrameInfo(int64_t frameTimeNanos) {
  double deltaSeconds = lastFrameTimeNanos_ == 0 ? 0 : static_cast<double>(frameTimeNanos - lastFrameTimeNanos_) / 1e9;
  lastFrameTimeNanos_ = frameTimeNanos;
  elapsedSeconds_ += deltaSeconds;
  return FrameInfo(static_cast<double>(frameTimeNanos), deltaSeconds, elapsedSeconds_, frameIndex_++);
}

void EngineCore::renderFrame(int64_t frameTimeNanos) {
  loads_.update();
  if (textures_ != nullptr) {
    textures_->update();
  }
  if (recording_ || !canRenderAnyTarget()) {
    lastFrameTimeNanos_ = 0;
    updateDemand();
    return;
  }
  frameRequested_ = false;
  runFrameStages(nextFrameInfo(frameTimeNanos));
  for (const std::shared_ptr<ViewTargetCore>& target : targets_) {
    target->render(frameTimeNanos);
  }
  updateDemand();
}

void EngineCore::runFrameStages(const FrameInfo& frame) {
  ::filament::TransformManager& transforms = engine_->getTransformManager();
  transformBindings_.forEachActive([&](TransformBindingCore& binding) { binding.apply(transforms); });
  manipulators_.forEachActive([&](ManipulatorCore& manipulator) { manipulator.drain(frame.deltaSeconds); });
  if (!frameListeners_.empty()) {
    if (std::shared_ptr<worklets::WorkletRuntime> runtime = this->runtime()) {
      listenersWantFrame_ = frameListeners_.dispatch(frame, *runtime);
    }
  }
  playersWantFrame_ = false;
  players_.forEachActive([&](AnimationPlayerCore& player) { playersWantFrame_ = player.advance(frame.deltaSeconds) || playersWantFrame_; });
  physicsWantsFrame_ = false;
  physicsWorlds_.forEachActive([&](PhysicsWorldCore& world) {
    if (world.autoSteps()) {
      physicsWantsFrame_ = world.step(frame.deltaSeconds) || physicsWantsFrame_;
    }
  });
  skeletonFollowers_.forEachActive([&](SkeletonFollower& follower) { follower.apply(transforms); });
}

void EngineCore::setRecording(bool recording) {
  recording_ = recording;
  lastFrameTimeNanos_ = 0;
  updateDemand();
}

std::shared_ptr<Promise<void>> EngineCore::shutdown() {
  std::unique_lock lock(shutdownMutex_);
  if (shutdownPromise_ != nullptr) {
    return shutdownPromise_;
  }
  shutdownPromise_ = Promise<void>::create();
  live_ = false;
  thread_->post({.run = [self = shared_from_this()] { self->shutdownOnRenderThread(); }});
  return shutdownPromise_;
}

void EngineCore::shutdownOnRenderThread() {
  thread_->close();
  if (std::shared_ptr<worklets::WorkletRuntime> runtime = this->runtime()) {
    runtime->runSync([&](jsi::Runtime&) { frameListeners_.clear(); });
  }
  loads_.cancelAll();
  textures_.reset();
  players_.clear();
  transformBindings_.clear();
  manipulators_.clear();
  skeletonFollowers_.clear();
  physicsWorlds_.clear();
  resources_->markDisposing();
  resources_->destroyTree();
  targets_.clear();
  materialAssignments_.clear();
  gltf_.reset();
  {
    std::unique_lock lock(runtimeMutex_);
    runtime_ = nullptr;
  }
  if (engine_ != nullptr) {
    ::filament::Engine::destroy(&engine_);
  }
  thread_->setVsyncEnabled(false);
  thread_->quit();
  WorkerPool::shared().post([self = shared_from_this()] {
    self->thread_->join();
    self->shutdownPromise_->resolve();
  });
}

} // namespace margelo::nitro::filament
