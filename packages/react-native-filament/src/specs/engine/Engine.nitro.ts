import type { HybridObject, Sync } from 'react-native-nitro-modules'
import type { EngineBackend } from '../types/EngineBackend'
import type { AssetSource } from '../types/AssetSource'
import type { DirectionalLightOptions } from '../types/DirectionalLightOptions'
import type { Float4 } from '../types/Float4'
import type { IndirectLightOptions } from '../types/IndirectLightOptions'
import type { ModelLoadOptions } from '../types/ModelLoadOptions'
import type { FrameInfo } from '../types/FrameInfo'
import type { RenderMode } from '../types/RenderMode'
import type { ViewTargetOptions } from '../types/ViewTargetOptions'
import type { FilamentView } from '../targets/FilamentView.nitro'
import type { ViewTarget } from '../targets/ViewTarget.nitro'
import type { Model } from '../assets/Model.nitro'
import type { Camera } from '../scene/Camera.nitro'
import type { IndirectLight } from '../scene/IndirectLight.nitro'
import type { Light } from '../scene/Light.nitro'
import type { Scene } from '../scene/Scene.nitro'
import type { Skybox } from '../scene/Skybox.nitro'
import type { FrameListenerSubscription } from './FrameListenerSubscription.nitro'
import type { RenderThread } from './RenderThread.nitro'

export interface Engine extends HybridObject<{ ios: 'c++'; android: 'c++' }> {
  /** @thread any */
  readonly backend: EngineBackend
  /** @thread any */
  readonly renderThread: RenderThread
  /**
   * Cheap atomic store; wakes the render thread when demand changes.
   * @thread any
   */
  renderMode: RenderMode
  /**
   * Renders into `view` once its surface exists, and follows its surface changes.
   * @thread any
   */
  createViewTarget(view: FilamentView, options: ViewTargetOptions): Promise<ViewTarget>
  /** @thread render */
  createScene(): Scene
  /** @thread render */
  createCamera(): Camera
  /**
   * A skybox of one linear RGBA color.
   * @thread render
   */
  createSkybox(color: Float4): Skybox
  /** @thread render */
  createDirectionalLight(options: DirectionalLightOptions): Light
  /**
   * Loads a glTF 2.0 binary (.glb). Resolves once every texture and buffer is uploaded.
   * @thread any
   */
  loadModel(source: AssetSource, options: ModelLoadOptions): Promise<Model>
  /**
   * Loads image-based lighting from a KTX1 cubemap with spherical harmonics, as `cmgen` writes it.
   * @thread any
   */
  loadIndirectLight(source: AssetSource, options: IndirectLightOptions): Promise<IndirectLight>
  /**
   * Calls `listener` once per rendered frame, before native systems run and the targets render.
   * The listener returns whether it needs another frame: in `on-demand` mode the Engine keeps
   * rendering while any listener returns `true`. In `continuous` mode every frame renders anyway.
   * @thread render
   */
  addOnFrameListener(listener: Sync<(frame: FrameInfo) => boolean>): FrameListenerSubscription
  /**
   * Renders one more frame in `on-demand` mode.
   * @thread any
   */
  requestFrame(): void
  /**
   * Starts shutdown if needed. Every caller's Promise resolves after every native resource is
   * destroyed and the render thread has exited.
   * @thread RN or UI runtime
   */
  shutdown(): Promise<void>
}
