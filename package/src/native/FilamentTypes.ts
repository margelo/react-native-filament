import type { FilamentBuffer } from './FilamentBuffer'
import { TSurface } from './FilamentViewTypes'

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

/**
 * A `Scene` is a flat container of `RenderableManager` and `LightManager`
 * components.
 *
 * A `Scene` doesn't provide a hierarchy of objects, i.e.: it's not a scene-graph.
 * However, it manages the list of objects to render and the list of lights. These can
 * be added or removed from a `Scene` at any time.
 * Moreover clients can use `TransformManager` to create a graph of transforms.
 *
 * A `RenderableManager` component must be added to a `Scene` in order
 * to be rendered, and the `Scene` must be provided to a `View`.
 *
 * ## Creation and Destruction
 *
 * A `Scene` is created using `Engine#createScene` and destroyed using
 * `Engine#destroyScene(Scene)`.
 *
 * @see View
 * @see LightManager
 * @see RenderableManager
 * @see TransformManager
 */
export interface Scene {
  addEntity(entity: Entity): void
}

export interface Manipulator {}

/**
 * Camera represents the eye through which the scene is viewed.
 *
 * A Camera has a position and orientation and controls the projection and exposure parameters.
 *
 * ## Creation and destruction
 *
 * In Filament, Camera is a component that must be associated with an entity. To do so,
 * use `Engine#createCamera(int)`. A Camera component is destroyed using
 * `Engine#destroyCameraComponent(int Entity)`.
 *
 * ```typescript
 *  const myCamera = engine.createCamera(myCameraEntity);
 *  myCamera.setProjection(45, 16.0/9.0, 0.1, 1.0);
 *  myCamera.lookAt(0, 1.60, 1,
 *                  0, 0, 0,
 *                  0, 1, 0);
 *  engine.destroyCameraComponent(myCameraEntity);
 * ```
 *
 * ## Coordinate system
 *
 * The camera coordinate system defines the *view space*. The camera points towards its -z axis
 * and is oriented such that its top side is in the direction of +y, and its right side in the
 * direction of +x.
 *
 * Since the *near* and *far* planes are defined by the distance from the camera,
 * their respective coordinates are -distance_near and -distance_far.
 *
 * ## Clipping planes
 *
 * The camera defines six *clipping planes* which together create a *clipping volume*. The
 * geometry outside this volume is clipped.
 *
 * The clipping volume can either be a box or a frustum depending on which projection is used,
 * respectively `Projection.ORTHO` or `Projection.PERSPECTIVE`. The six planes are specified
 * either directly or indirectly using `setProjection` or `setLensProjection`.
 *
 * The six planes are:
 * - left
 * - right
 * - bottom
 * - top
 * - near
 * - far
 *
 * To increase the depth-buffer precision, the *far* clipping plane is always assumed to be at
 * infinity for rendering. That is, it is not used to clip geometry during rendering.
 * However, it is used during the culling phase (objects entirely behind the *far*
 * plane are culled).
 *
 * ## Choosing the *near* plane distance
 *
 * The *near* plane distance greatly affects the depth-buffer resolution.
 *
 * Example: Precision at 1m, 10m, 100m and 1Km for various near distances assuming a 32-bit float
 * depth-buffer
 *
 * | near (m) | 1 m    | 10 m   | 100 m  | 1 Km   |
 * |----------|--------|--------|--------|--------|
 * | 0.001    | 7.2e-5 | 0.0043 | 0.4624 | 48.58  |
 * | 0.01     | 6.9e-6 | 0.0001 | 0.0430 | 4.62   |
 * | 0.1      | 3.6e-7 | 7.0e-5 | 0.0072 | 0.43   |
 * | 1.0      | 0      | 3.8e-6 | 0.0007 | 0.07   |
 *
 * As can be seen in the table above, the depth-buffer precision drops rapidly with the
 * distance to the camera.
 *
 * Make sure to pick the highest *near* plane distance possible.
 *
 * ## Exposure
 *
 * The Camera is also used to set the scene's exposure, just like with a real camera. The lights
 * intensity and the Camera exposure interact to produce the final scene's brightness.
 *
 * @see View
 */
export interface Camera {
  // Convenience method. The original method works slightly different, this is a simplification, so we don't have to deal with out params.
  lookAt(cameraManipulator: Manipulator): void
}

/**
 * Encompasses all the state needed for rendering a {@link Scene}.
 *
 * {@link Renderer#render} operates on `View` objects. These `View` objects
 * specify important parameters such as:
 *
 * - The Scene
 * - The Camera
 * - The Viewport
 * - Some rendering parameters
 *
 * `View` instances are heavy objects that internally cache a lot of data needed for
 * rendering. It is not advised for an application to use many View objects.
 *
 * For example, in a game, a `View` could be used for the main scene and another one for
 * the game's user interface. More `View` instances could be used for creating special
 * effects (e.g. a `View` is akin to a rendering pass).
 **/
export interface View {
  camera: Camera
  scene: Scene
  setViewport(x: number, y: number, width: number, height: number): void
}

// TODO: I think entities are at their core just numbers maybe we can expose them just as such to JS
export interface Entity {}

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
export interface SwapChain {}

export interface Engine {
  createRenderer(): Renderer
  createScene(): Scene
  createCamera(): Camera
  createView(): View
  createSwapChain(surface: TSurface): SwapChain

  // Convenience methods:
  createDefaultLight(): Entity
  createCameraManipulator(screenWidth: number, screenHeight: number): Manipulator
  loadAsset(buffer: FilamentBuffer, scene: Scene): void
}
