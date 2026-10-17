/**
 * Config is used to define the memory footprint used by the engine, such as the
 * command buffer size. Config can be used to customize engine requirements based
 * on the applications needs.
 *
 *    .perRenderPassArenaSizeMB (default: 3 MiB)
 *   +--------------------------+
 *   |                          |
 *   | .perFrameCommandsSizeMB  |
 *   |    (default 2 MiB)       |
 *   |                          |
 *   +--------------------------+
 *   |  (froxel, etc...)        |
 *   +--------------------------+
 *
 *
 *      .commandBufferSizeMB (default 3MiB)
 *   +--------------------------+
 *   | .minCommandBufferSizeMB  |
 *   +--------------------------+
 *   | .minCommandBufferSizeMB  |
 *   +--------------------------+
 *   | .minCommandBufferSizeMB  |
 *   +--------------------------+
 *   :                          :
 *   :                          :
 *
 */
export type EngineConfig = {
  /**
   * Size in MiB of the low-level command buffer arena.
   *
   * Each new command buffer is allocated from here. If this buffer is too small the program
   * might terminate or rendering errors might occur.
   *
   * This is typically set to {@linkcode minCommandBufferSizeMB} * 3, so that up to 3 frames can be
   * batched-up at once.
   *
   * This value affects the application's memory usage.
   *
   * @default minCommandBufferSizeMB * 3
   */
  commandBufferSizeMB?: number

  /**
   * Size in MiB of the per-frame data arena.
   *
   * This is the main arena used for allocations when preparing a frame.
   * e.g.: Froxel data and high-level commands are allocated from this arena.
   *
   * If this size is too small, the program will abort on debug builds and have undefined
   * behavior otherwise.
   *
   * This value affects the application's memory usage.
   *
   * @default 3
   */
  perRenderPassArenaSizeMB?: number

  /**
   * Size in MiB of the backend's handle arena.
   *
   * Backends will fallback to slower heap-based allocations when running out of space and
   * log this condition.
   *
   * If 0, then the default value for the given platform is used
   *
   * This value affects the application's memory usage.
   *
   * @default 0
   */
  driverHandleArenaSizeMB?: number

  /**
   * Minimum size in MiB of a low-level command buffer.
   *
   * This is how much space is guaranteed to be available for low-level commands when a new
   * buffer is allocated. If this is too small, the engine might have to stall to wait for
   * more space to become available, this situation is logged.
   *
   * This value does not affect the application's memory usage.
   *
   * @default 1
   */
  minCommandBufferSizeMB?: number

  /**
   * Size in MiB of the per-frame high level command buffer.
   *
   * This buffer is related to the number of draw calls achievable within a frame, if it is
   * too small, the program will abort on debug builds and have undefined behavior otherwise.
   *
   * It is allocated from the 'per-render-pass arena' above. Make sure that at least 1 MiB is
   * left in the per-render-pass arena when deciding the size of this buffer.
   *
   * This value does not affect the application's memory usage.
   *
   * @default 2
   */
  perFrameCommandsSizeMB?: number

  /**
   * Number of threads to use in Engine's JobSystem.
   *
   * Engine uses a utils::JobSystem to carry out paralleization of Engine workloads. This
   * value sets the number of threads allocated for JobSystem. Configuring this value can be
   * helpful in CPU-constrained environments where too many threads can cause contention of
   * CPU and reduce performance.
   *
   * The default value is 0, which implies that the Engine will use a heuristic to determine
   * the number of threads to use.
   *
   * @default 0
   */
  jobSystemThreadCount?: number

  /**
   * Number of most-recently destroyed textures to track for use-after-free.
   *
   * This will cause the backend to throw an exception when a texture is freed but still bound
   * to a SamplerGroup and used in a draw call. 0 disables completely.
   *
   * Currently only respected by the Metal backend.
   *
   * @default 0
   */
  textureUseAfterFreePoolSize?: number

  /**
   * This value determines for how many frames are texture entries kept in the cache.
   * @default 2
   */
  resourceAllocatorCacheMaxAge?: number
}

/**
 * @default 'default'
 */
export type EngineBackend = 'opengl' | 'vulkan' | 'metal' | 'default'
