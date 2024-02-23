//
// Created by Marc Rousavy on 23.02.24.
//

#pragma once

#include <filament/Engine.h>
#include <functional>
#include <memory>

namespace margelo {

template <typename T> struct References {
public:
  using CleanupRefFunction = std::function<void(T* ref)>;
  using CleanupEngineRefFunction = std::function<void(std::shared_ptr<filament::Engine> engine, T* ref)>;

  struct Deleter {
  public:
    explicit Deleter(const CleanupRefFunction& cleanup) : _cleanup(std::move(cleanup)) {}
    void operator()(T* ref) {
      _cleanup(ref);
    }

  private:
    CleanupRefFunction _cleanup;
  };

  /**
   * Adopt a raw reference to T and take over it's memory ownership.
   * When the resulting `shared_ptr` is deleted, `cleanup` will be called with the reference to T, and the caller is expected to properly
   * clean up T.
   * @param value The raw reference to T that will be adopted.
   * @param cleanup The function to run when the shared_ptr's ref count reaches zero. The caller is expected to delete the reference to T
   * here.
   * @return A shared_ptr safely managing the reference to T.
   */
  static std::shared_ptr<T> adoptRef(T* value, const CleanupRefFunction& cleanup) {
    return std::shared_ptr<T>(value, Deleter(std::move(cleanup)));
  }

  /**
   * Same as `adoptRef(T*, CleanupRefFunction)`, but with an additional argument: `Engine`.
   * This is used to clean up children of `Engine`, e.g. via `Engine::destroy(Renderer)`.
   */
  static std::shared_ptr<T> adoptEngineRef(std::shared_ptr<filament::Engine> engine, T* value, CleanupEngineRefFunction cleanup) {
    return adoptRef(value, [engine, cleanup = std::move(cleanup)](T* ref) { cleanup(engine, ref); });
  }
};

} // namespace margelo
