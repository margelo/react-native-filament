/**
 * A `SwapChain` represents an Operating System's native renderable surface.
 *
 * Typically it's a native window or a view. Because a `SwapChain` is initialized
 * from a native object, it is given to filament as an `Object`, which must be of the
 * proper type for each platform filament is running on.
 *
 * Example:
 * ```
 * SwapChain swapChain = engine.createSwapChain(nativeWindow);
 * ```
 *
 * The `nativeWindow` parameter above must be of type:
 *
 * Platform   | nativeWindow type
 * -----------|------------------
 * Android    | `android.view.Surface`
 *
 * ## Examples
 *
 * ### Android
 *
 * A `Surface` can be retrieved from a `SurfaceView` or `SurfaceHolder`
 * easily using `SurfaceHolder.getSurface()` and/or `SurfaceView.getHolder()`.
 *
 * To use a `TextureView` as a `SwapChain`, it is necessary to first get its `SurfaceTexture`,
 * for instance using `TextureView.SurfaceTextureListener` and then create a `Surface`:
 *
 * ```java
 * // using a TextureView.SurfaceTextureListener:
 * public void onSurfaceTextureAvailable(SurfaceTexture surfaceTexture, int width, int height) {
 *     mSurface = new Surface(surfaceTexture);
 *     // mSurface can now be used with Engine.createSwapChain()
 * }
 * ```
 *
 * @see Engine
 */

import { PointerHolder } from './PointerHolder'

export interface SwapChain extends PointerHolder {}
