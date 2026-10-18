#include "ViewTargetCore.hpp"

#include "HybridSnapshot.hpp"
#include "QueryTickets.hpp"

#include <backend/PixelBufferDescriptor.h>
#include <filament/Camera.h>
#include <filament/Viewport.h>

#include <algorithm>
#include <stdexcept>

namespace margelo::nitro::filament {

ViewTargetCore::ViewTargetCore(::filament::Engine& engine, ::filament::Renderer& renderer,
                               ::filament::backend::CallbackHandler& callbacks, ClearSettings clear)
    : ViewHost("ViewTarget", engine, renderer, clear), callbacks_(callbacks) {}

void ViewTargetCore::attach(const std::shared_ptr<HybridNativeSurfaceSpec>& surface) {
  if (surface_ != nullptr) {
    detach(surface_);
  }
  uint64_t handle = surface->getHandle();
  if (!isLive() || handle == 0) {
    surface->release();
    return;
  }
  uint64_t flags = surface->getTransparent() ? ::filament::SwapChain::CONFIG_TRANSPARENT : 0;
  swapChain_ = engine_.createSwapChain(reinterpret_cast<void*>(handle), flags);
  surface_ = surface;
  revoked_ = false;
  updateViewport(surface);
}

void ViewTargetCore::resize(const std::shared_ptr<HybridNativeSurfaceSpec>& surface) {
  if (surface == surface_) {
    updateViewport(surface);
  }
}

void ViewTargetCore::detach(const std::shared_ptr<HybridNativeSurfaceSpec>& surface) {
  if (surface != surface_) {
    surface->release();
    return;
  }
  destroySwapChain();
  surface_->release();
  surface_ = nullptr;
  width_ = 0;
  height_ = 0;
}

bool ViewTargetCore::canRender() const {
  return isLive() && swapChain_ != nullptr && !revoked_ && width_ > 0 && height_ > 0;
}

bool ViewTargetCore::hasPendingQueries() const {
  return !pendingPicks_.empty() || !pendingSnapshots_.empty();
}

ViewTargetCore::FrameResult ViewTargetCore::render(int64_t frameTimeNanos) {
  if (!canRender()) {
    return FrameResult::NONE;
  }
  double framesPerSecond = targetFrameRate_;
  if (framesPerSecond > 0 && lastRenderedNanos_ != 0) {
    auto intervalNanos = static_cast<int64_t>(1e9 / framesPerSecond);
    if (frameTimeNanos - lastRenderedNanos_ < intervalNanos - intervalNanos / 4) {
      return FrameResult::DEFERRED;
    }
  }
  beginFrame(swapChain_, static_cast<uint64_t>(frameTimeNanos));
  renderer_->render(view_);
  readRequestedSnapshots();
  renderer_->endFrame();
  lastRenderedNanos_ = frameTimeNanos;
  firstFrame_.fire();
  return FrameResult::RENDERED;
}

void ViewTargetCore::setTargetFrameRate(double framesPerSecond) {
  targetFrameRate_ = framesPerSecond;
}

double ViewTargetCore::targetFrameRate() const {
  return targetFrameRate_;
}

void ViewTargetCore::revoke() {
  revoked_ = true;
}

double ViewTargetCore::width() const {
  return width_;
}

double ViewTargetCore::height() const {
  return height_;
}

std::function<void()> ViewTargetCore::addFirstFrameListener(std::function<void()> listener) {
  return firstFrame_.add(std::move(listener));
}

std::function<void()> ViewTargetCore::addResizeListener(std::function<void(double width, double height)> listener) {
  std::function<void()> remove = resizeListeners_.add(listener);
  double width = width_;
  double height = height_;
  if (width > 0 && height > 0) {
    listener(width, height);
  }
  return remove;
}

void ViewTargetCore::pick(double x, double y, std::shared_ptr<PickPromise> promise) {
  const ::filament::Viewport& viewport = view_->getViewport();
  double pixelX = x * contentScale_;
  double pixelY = static_cast<double>(viewport.height) - y * contentScale_;
  if (pixelX < 0 || pixelY < 0 || pixelX >= viewport.width || pixelY >= viewport.height) {
    promise->resolve(std::nullopt);
    return;
  }
  uint64_t id = nextQueryId_++;
  pendingPicks_.emplace(id, std::move(promise));
  auto* ticket = new PickTicket{.target = std::static_pointer_cast<ViewTargetCore>(shared_from_this()), .id = id};
  ::filament::View::PickingQuery& query =
      view_->pick(static_cast<uint32_t>(pixelX), static_cast<uint32_t>(pixelY), &callbacks_,
                  static_cast<::filament::View::PickingQueryResultCallback>(
                      [](const ::filament::View::PickingQueryResult& result, ::filament::View::PickingQuery* pending) {
                        static_cast<PickTicket*>(pending->storage[0])->onResult(result);
                      }));
  query.storage[0] = ticket;
}

void ViewTargetCore::completePick(uint64_t id, const ::filament::View::PickingQueryResult& result) {
  auto found = pendingPicks_.find(id);
  if (found == pendingPicks_.end()) {
    return;
  }
  std::shared_ptr<PickPromise> promise = std::move(found->second);
  pendingPicks_.erase(found);
  if (result.renderable.isNull()) {
    promise->resolve(std::nullopt);
    return;
  }
  const ::filament::Viewport& viewport = view_->getViewport();
  const ::filament::Camera& camera = view_->getCamera();
  ::filament::math::double4 clip(result.fragCoords.x / viewport.width * 2.0 - 1.0, result.fragCoords.y / viewport.height * 2.0 - 1.0,
                                 result.fragCoords.z * 2.0 - 1.0, 1.0);
  ::filament::math::double4 viewPosition = inverse(camera.getProjectionMatrix()) * clip;
  ::filament::math::double4 world = camera.getModelMatrix() * (viewPosition / viewPosition.w);
  promise->resolve(PickResult(static_cast<double>(result.renderable.getId()), std::make_tuple(world.x, world.y, world.z)));
}

void ViewTargetCore::takeSnapshot(std::shared_ptr<SnapshotPromise> promise) {
  uint64_t id = nextQueryId_++;
  pendingSnapshots_.emplace(id, std::move(promise));
  requestedSnapshots_.push_back(id);
}

void ViewTargetCore::completeSnapshot(uint64_t id, std::vector<uint8_t>&& pixels, uint32_t width, uint32_t height) {
  auto found = pendingSnapshots_.find(id);
  if (found == pendingSnapshots_.end()) {
    return;
  }
  std::shared_ptr<SnapshotPromise> promise = std::move(found->second);
  pendingSnapshots_.erase(found);
  auto snapshot = std::make_shared<const SnapshotCore>(SnapshotCore{.width = width, .height = height, .rgba = std::move(pixels)});
  promise->resolve(std::make_shared<HybridSnapshot>(snapshot));
}

void ViewTargetCore::readRequestedSnapshots() {
  if (requestedSnapshots_.empty()) {
    return;
  }
  auto width = static_cast<uint32_t>(width_);
  auto height = static_cast<uint32_t>(height_);
  for (uint64_t id : requestedSnapshots_) {
    auto* ticket = new SnapshotTicket{.target = std::static_pointer_cast<ViewTargetCore>(shared_from_this()),
                                      .id = id,
                                      .width = width,
                                      .height = height,
                                      .pixels = std::vector<uint8_t>(static_cast<size_t>(width) * height * 4)};
    renderer_->readPixels(0, 0, width, height,
                          ::filament::backend::PixelBufferDescriptor(
                              ticket->pixels.data(), ticket->pixels.size(), ::filament::backend::PixelDataFormat::RGBA,
                              ::filament::backend::PixelDataType::UBYTE, 1, 0, 0, 0, &callbacks_, &SnapshotTicket::onRead, ticket));
  }
  requestedSnapshots_.clear();
}

void ViewTargetCore::rejectPendingQueries() {
  auto disposed =
      std::make_exception_ptr(std::runtime_error("FilamentDisposedError: the ViewTarget was disposed before the query finished."));
  std::unordered_map<uint64_t, std::shared_ptr<PickPromise>> picks;
  picks.swap(pendingPicks_);
  for (auto& [id, promise] : picks) {
    promise->reject(disposed);
  }
  std::unordered_map<uint64_t, std::shared_ptr<SnapshotPromise>> snapshots;
  snapshots.swap(pendingSnapshots_);
  for (auto& [id, promise] : snapshots) {
    promise->reject(disposed);
  }
  requestedSnapshots_.clear();
}

void ViewTargetCore::destroyNative() {
  rejectPendingQueries();
  resizeListeners_.clear();
  firstFrame_.clear();
  if (surface_ != nullptr) {
    detach(surface_);
  }
  destroyViewHost();
}

double ViewTargetCore::pointsPerPixel() const {
  return 1 / contentScale_;
}

void ViewTargetCore::destroySwapChain() {
  if (swapChain_ == nullptr) {
    return;
  }
  destroyWindowSwapChain(swapChain_);
  swapChain_ = nullptr;
  engine_.flushAndWait();
}

void ViewTargetCore::updateViewport(const std::shared_ptr<HybridNativeSurfaceSpec>& surface) {
  double width = surface->getWidth();
  double height = surface->getHeight();
  contentScale_ = surface->getContentScale() > 0 ? surface->getContentScale() : 1;
  bool changed = width != width_ || height != height_;
  width_ = width;
  height_ = height;
  view_->setViewport({0, 0, static_cast<uint32_t>(width), static_cast<uint32_t>(height)});
  if (changed && width > 0 && height > 0) {
    resizeListeners_.emit(width, height);
  }
}

} // namespace margelo::nitro::filament
