import type { HybridObject, Sync } from 'react-native-nitro-modules'
import type { EngineBackend } from '../types/EngineBackend'
import type { Entity } from '../types/Entity'
import type { AssetSource } from '../types/AssetSource'
import type { DirectionalLightOptions } from '../types/DirectionalLightOptions'
import type { Float4 } from '../types/Float4'
import type { IndirectLightOptions } from '../types/IndirectLightOptions'
import type { PointLightOptions } from '../types/PointLightOptions'
import type { PlaneOptions } from '../types/PlaneOptions'
import type { DebugBoxOptions } from '../types/DebugBoxOptions'
import type { SpotLightOptions } from '../types/SpotLightOptions'
import type { SunLightOptions } from '../types/SunLightOptions'
import type { ModelLoadOptions } from '../types/ModelLoadOptions'
import type { TextureLoadOptions } from '../types/TextureLoadOptions'
import type { FrameInfo } from '../types/FrameInfo'
import type { RenderMode } from '../types/RenderMode'
import type { ViewTargetOptions } from '../types/ViewTargetOptions'
import type { FilamentView } from '../targets/FilamentView.nitro'
import type { ViewTarget } from '../targets/ViewTarget.nitro'
import type { Recorder } from '../targets/Recorder.nitro'
import type { PhysicsWorld } from '../physics/PhysicsWorld.nitro'
import type { PhysicsWorldOptions } from '../types/PhysicsWorldOptions'
import type { EngineDebugStats } from '../types/EngineDebugStats'
import type { RecorderOptions } from '../types/RecorderOptions'
import type { Model } from '../assets/Model.nitro'
import type { Material } from '../materials/Material.nitro'
import type { Texture } from '../materials/Texture.nitro'
import type { Camera } from '../scene/Camera.nitro'
import type { IndirectLight } from '../scene/IndirectLight.nitro'
import type { Light } from '../scene/Light.nitro'
import type { LightManager } from '../scene/LightManager.nitro'
import type { RenderableManager } from '../scene/RenderableManager.nitro'
import type { Renderable } from '../scene/Renderable.nitro'
import type { MaterialInstance } from '../materials/MaterialInstance.nitro'
import type { Scene } from '../scene/Scene.nitro'
import type { Skybox } from '../scene/Skybox.nitro'
import type { TransformManager } from '../scene/TransformManager.nitro'
import type { TransformBinding } from '../control/TransformBinding.nitro'
import type { ValueBinding } from '../control/ValueBinding.nitro'
import type { CameraManipulator } from '../control/CameraManipulator.nitro'
import type { OrbitManipulatorOptions } from '../types/OrbitManipulatorOptions'
import type { FrameListenerSubscription } from './FrameListenerSubscription.nitro'
import type { RenderThread } from './RenderThread.nitro'

/**
 * A Filament engine with its own render thread. Create one with `Filament.createEngine()`; it creates
 * and loads every other native object and renders into ViewTargets and Recorders.
 */
export interface Engine extends HybridObject<{ ios: 'c++'; android: 'c++' }> {
  /** @thread any */
  readonly backend: EngineBackend
  /** @thread any */
  readonly renderThread: RenderThread
  /**
   * The object is usable from any thread; its methods run on the render thread.
   * @thread any
   */
  readonly transformManager: TransformManager
  /**
   * The object is usable from any thread; its methods run on the render thread.
   * @thread any
   */
  readonly lightManager: LightManager
  /**
   * The object is usable from any thread; its methods run on the render thread.
   * @thread any
   */
  readonly renderableManager: RenderableManager
  /**
   * When the Engine renders its targets.
   * @default 'continuous'
   * @thread any
   */
  renderMode: RenderMode
  /**
   * Renders into `view` once its surface exists, and follows its surface changes.
   * @thread any
   */
  createViewTarget(view: FilamentView, options: ViewTargetOptions): Promise<ViewTarget>
  /**
   * An offscreen MP4 recorder with its own View. Use an Engine dedicated to recording.
   * @thread render
   */
  createRecorder(options: RecorderOptions): Recorder
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
   * A directional light whose angular radius shapes its highlight on glossy surfaces. The skyboxes this
   * library creates do not draw the sun disk.
   * @thread render
   */
  createSunLight(options: SunLightOptions): Light
  /** @thread render */
  createPointLight(options: PointLightOptions): Light
  /** @thread render */
  createSpotLight(options: SpotLightOptions): Light
  /**
   * A physically correct spot light: its power spreads over its cone, so a wider cone looks dimmer.
   * @thread render
   */
  createFocusedSpotLight(options: SpotLightOptions): Light
  /**
   * A horizontal plane centered at the origin, facing +Y, drawn with `material` — for example a
   * shadow catcher from a `shadowingEnabled` material.
   * @thread render
   */
  createPlane(options: PlaneOptions, material: MaterialInstance): Renderable
  /**
   * A full-screen triangle drawn behind everything else, for a material whose vertex domain is
   * `device`, such as an image background.
   * @thread render
   */
  createBackground(material: MaterialInstance): Renderable
  /**
   * Wireframe edges of a box, for visualizing bounds.
   * @thread render
   */
  createDebugBox(options: DebugBoxOptions): Renderable
  /**
   * Loads a glTF 2.0 binary (.glb). Resolves once every texture and buffer is uploaded.
   * @thread any
   */
  loadModel(source: AssetSource, options: ModelLoadOptions): Promise<Model>
  /**
   * Loads a compiled material (`.filamat`).
   * @thread any
   */
  loadMaterial(source: AssetSource): Promise<Material>
  /**
   * Loads a PNG, JPEG or KTX2 image. Resolves once every mip level is uploaded.
   * @thread any
   */
  loadTexture(source: AssetSource, options: TextureLoadOptions): Promise<Texture>
  /**
   * Loads a skybox from a KTX1 cubemap, as `cmgen` writes it.
   * @thread any
   */
  loadSkybox(source: AssetSource): Promise<Skybox>
  /**
   * Loads image-based lighting from a KTX1 cubemap with spherical harmonics, as `cmgen` writes it.
   * @thread any
   */
  loadIndirectLight(source: AssetSource, options: IndirectLightOptions): Promise<IndirectLight>
  /**
   * Binds the local transform of `entity`, starting from its current value. Validates the entity
   * here; the binding's setters work from any thread.
   * @thread render
   */
  createTransformBinding(entity: Entity): TransformBinding
  /** @thread any */
  createValueBinding(initialValue: number): ValueBinding
  /**
   * A manipulator in orbit mode. Cameras follow it through `camera.followManipulator()`.
   * @thread any
   */
  createOrbitManipulator(options: OrbitManipulatorOptions): CameraManipulator
  /**
   * Counts of the native resources this Engine still holds, for finding leaks.
   * @thread any
   */
  getDebugStats(): EngineDebugStats
  /**
   * A Bullet physics world simulated on this Engine's render thread.
   * @thread render
   */
  createPhysicsWorld(options: PhysicsWorldOptions): PhysicsWorld
  /**
   * Calls `listener` once per rendered frame, after transform bindings and camera manipulators are
   * applied and before animation players and physics run and the targets render, so a
   * TransformBinding set in the listener takes effect on the next frame. The listener returns
   * whether it needs another frame: in `on-demand` mode the Engine keeps rendering while any
   * listener returns `true`. In `continuous` mode every frame renders anyway.
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
