import { View } from './View'
import { SwapChain } from './SwapChain'

/**
 * A `Renderer` instance represents an operating system's window.
 *
 * Typically, applications create a `Renderer` per window. The `Renderer` generates
 * drawing commands for the render thread and manages frame latency.
 *
 * A `Renderer` generates drawing commands from a `View`, itself containing a Scene description.
 *
 * ## Creation and Destruction
 *
 * A `Renderer` is created using `Engine#createRenderer` and destroyed
 * using `Engine#destroyRenderer`.
 *
 * [Engine](#engine)
 * [View](#view)
 */

export interface Renderer {
  /**
   * Sets up a frame for this `Renderer`.
   *
   * `beginFrame` manages frame pacing, and returns whether or not a frame should be drawn.
   * The goal of this is to skip frames when the GPU falls behind in order to keep the frame latency low.
   *
   * If a given frame takes too much time in the GPU, the CPU will get ahead of the GPU.
   * The display will draw the same frame twice producing a stutter.
   * At this point, the CPU is ahead of the GPU and depending on how many frames are buffered, latency increases.
   * `beginFrame()` attempts to detect this situation and returns `false` in that case,
   * indicating to the caller to skip the current frame.
   *
   * All calls to `render()` must happen *after* `beginFrame()`.
   *
   * @param swapChain - The `SwapChain` instance to use.
   * @param frameTimeNanos - The time in nanoseconds when the frame started being rendered,
   *                         in the `System.nanoTime()` timebase.
   *                         Divide this value by 1000000 to convert it to the `SystemClock.uptimeMillis()` time base.
   *                         This typically comes from `android.view.Choreographer.FrameCallback`.
   * @returns `true`: The current frame must be drawn, and `endFrame()` must be called.
   *          `false`: The current frame should be skipped.
   *                   When skipping a frame, the whole frame is canceled, and `endFrame()` must not be called.
   *                   However, the user can choose to proceed as though `true` was returned and produce a frame anyways,
   *                   by making calls to `render(View)`, in which case `endFrame()` must be called.
   *
   * @see endFrame
   * @see render
   */
  beginFrame(swapChain: SwapChain, frameTimeNanos: number): boolean
  /**
   * Renders a {@link View} into this `Renderer`'s window.
   *
   * This is filament's main rendering method, most of the CPU-side heavy lifting is performed
   * here. The purpose of the `render()` function is to generate render commands which
   * are asynchronously executed by the {@link Engine}'s render thread.
   *
   * `render()` generates commands for each of the following stages:
   * - Shadow map passes, if needed
   * - Depth pre-pass
   * - SSAO pass, if enabled
   * - Color pass
   * - Post-processing pass
   */
  render(view: View): void
  /**
   * Finishes the current frame and schedules it for display.
   *
   * `endFrame()` schedules the current frame to be displayed on the `Renderer`'s window.
   *
   * All calls to `render()` must happen *before* `endFrame()`.
   *
   * @see beginFrame
   * @see render
   */
  endFrame(): void
}
