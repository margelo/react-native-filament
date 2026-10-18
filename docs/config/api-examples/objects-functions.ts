import type { ApiExample } from './types'

export const objectAndFunctionExamples: Record<string, ApiExample> = {
  'hybrid-objects/AnimationPlayer': {
    declarative: `
import React, { useEffect, useMemo } from 'react'
import { Button } from 'react-native'
import { useAnimationPlayer, useModel } from 'react-native-filament'

// <Animator> inside <Model> plays through an AnimationPlayer without a hook.
function DroneControls() {
  const drone = useModel(require('./drone.glb'))
  const instance = useMemo(() => (drone.state === 'loaded' ? drone.model.getInstance(0) : undefined), [drone])
  const player = useAnimationPlayer(instance)

  useEffect(() => {
    player?.play(0, { loop: true, speed: 1.5 })
  }, [player])

  return <Button title="Pause" onPress={() => player?.pause()} />
}
`,
    imperative: `
import type { Model } from 'react-native-filament'

function createDancePlayer(model: Model) {
  const { animator } = model.getInstance(0)
  const player = animator.createPlayer()
  player.play(0, { loop: true })
  return {
    switchTo: (index: number) => player.play(index, { crossFadeSeconds: 0.3 }),
    scrubTo: (seconds: number) => {
      player.pause()
      player.seek(seconds)
    },
    stop: () => player.dispose(),
  }
}
`,
  },

  'hybrid-objects/Animator': {
    declarative: `
import { useAnimator, useFrameCallback, useModel } from 'react-native-filament'

function ScrubbedDancer({ speed }: { speed: number }) {
  const dancer = useModel(require('./dancer.glb'))
  const animator = useAnimator(dancer)
  const duration = animator?.animations[0]?.durationSeconds ?? 1

  useFrameCallback(
    ({ elapsedSeconds }) => {
      'worklet'
      if (animator == null) return
      animator.applyAnimation(0, (elapsedSeconds * speed) % duration)
      animator.updateBoneMatrices()
    },
    [animator, duration, speed]
  )
  return null
}
`,
    imperative: `
import { runOnRenderThread, type Engine, type Model } from 'react-native-filament'

// fromSeconds is the time the previous animation had reached, so it keeps moving during the fade.
function crossFade(engine: Engine, model: Model, from: number, fromSeconds: number, to: number, fadeSeconds: number) {
  const { animator } = model.getInstance(0)
  const count = animator.animations.length
  if (from >= count || to >= count) throw new Error('The model has only ' + count + ' animations')
  return runOnRenderThread(engine, () => {
    'worklet'
    let start = -1
    return engine.addOnFrameListener(({ elapsedSeconds }) => {
      if (start < 0) start = elapsedSeconds
      const time = elapsedSeconds - start
      animator.applyAnimation(to, time)
      if (time < fadeSeconds) animator.applyCrossFade(from, fromSeconds + time, time / fadeSeconds)
      animator.updateBoneMatrices()
      return true
    })
  })
}
`,
  },

  'hybrid-objects/Model': {
    declarative: `
import React, { useEffect } from 'react'
import { Camera, DefaultLight, FilamentScene, FilamentView, Model, ModelRenderer, useModel } from 'react-native-filament'

function Drone() {
  const drone = useModel(require('./drone.glb'))
  useEffect(() => {
    if (drone.state === 'loaded') console.log(drone.model.entities.length, drone.boundingBox.halfExtent)
  }, [drone])
  return <ModelRenderer model={drone} transformToUnitCube />
}

export function App() {
  return (
    <FilamentScene>
      <FilamentView style={{ flex: 1 }}>
        <Camera />
        <DefaultLight />
        <Drone />
        <Model source={require('./coin.glb')} translate={[0, -1.5, 0]} onPress={(entity) => console.log(entity)} />
      </FilamentView>
    </FilamentScene>
  )
}
`,
    imperative: `
import { Image } from 'react-native'
import { runOnRenderThread, type Engine, type Scene } from 'react-native-filament'

const drone = Image.resolveAssetSource(require('./drone.glb'))

async function showDrones(engine: Engine, scene: Scene) {
  const model = await engine.loadModel({ uri: drone.uri }, { instanceCount: 2 })
  const spacing = model.boundingBox.halfExtent[0] * 2
  const [left, right] = [model.getInstance(0), model.getInstance(1)]
  await runOnRenderThread(engine, () => {
    'worklet'
    scene.addModel(model)
    engine.transformManager.setTranslation(left.rootEntity, [-spacing, 0, 0])
    engine.transformManager.setTranslation(right.rootEntity, [spacing, 0, 0])
  })
  return () => model.dispose()
}
`,
  },

  'hybrid-objects/ModelInstance': {
    declarative: `
import React from 'react'
import { Animator, ModelInstance, ModelRenderer, useModel, useRenderThreadEffect } from 'react-native-filament'

function Dancers() {
  const dancers = useModel(require('./dancer.glb'), { instanceCount: 2 })
  const model = dancers.state === 'loaded' ? dancers.model : undefined

  useRenderThreadEffect(() => {
    'worklet'
    if (model == null) return
    const follower = model.getInstance(1)
    follower.followSkeleton(model.getInstance(0))
    return () => follower.followSkeleton(undefined)
  }, [model])

  return (
    <ModelRenderer model={dancers}>
      <ModelInstance index={0} translate={[-0.8, 0, 0]}>
        <Animator animationIndex={1} />
      </ModelInstance>
      <ModelInstance index={1} translate={[0.8, 0, 0]} />
    </ModelRenderer>
  )
}
`,
    imperative: `
import { Image } from 'react-native'
import { runOnRenderThread, type Engine, type Scene } from 'react-native-filament'

const dancer = Image.resolveAssetSource(require('./dancer.glb'))

async function showDancers(engine: Engine, scene: Scene) {
  const model = await engine.loadModel({ uri: dancer.uri }, { instanceCount: 2 })
  const leader = model.getInstance(0)
  const follower = model.getInstance(1)
  await runOnRenderThread(engine, () => {
    'worklet'
    scene.addModel(model)
    engine.transformManager.setTranslation(follower.rootEntity, [1, 0, 0])
    follower.followSkeleton(leader)
    if (leader.materialVariants.length > 1) follower.applyMaterialVariant(1)
  })
  const player = leader.animator.createPlayer()
  player.play(0, {})
  return { model, player }
}
`,
  },

  'hybrid-objects/CameraManipulator': {
    declarative: `
import React from 'react'
import { GestureDetector } from 'react-native-gesture-handler'
import { Camera, DefaultLight, FilamentScene, FilamentView, Model, useCameraManipulator, useOrbitGestures, type CameraManipulator } from 'react-native-filament'

function OrbitView({ manipulator }: { manipulator: CameraManipulator }) {
  const gesture = useOrbitGestures(manipulator)
  return (
    <GestureDetector gesture={gesture}>
      <FilamentView style={{ flex: 1 }}>
        <Camera cameraManipulator={manipulator} />
        <DefaultLight />
        <Model source={require('./helmet.glb')} transformToUnitCube />
      </FilamentView>
    </GestureDetector>
  )
}

function OrbitScene() {
  const manipulator = useCameraManipulator({ homePosition: [0, 0, 6], orbitSpeed: 0.003 })
  return manipulator == null ? null : <OrbitView manipulator={manipulator} />
}

export function App() {
  return (
    <FilamentScene>
      <OrbitScene />
    </FilamentScene>
  )
}
`,
    imperative: `
import { runOnRenderThread, type Camera, type Engine } from 'react-native-filament'

async function orbitCamera(engine: Engine, camera: Camera, width: number, height: number) {
  const manipulator = engine.createOrbitManipulator({ homePosition: [0, 0, 6], targetPosition: [0, 0, 0] })
  manipulator.setViewport(width, height)
  await runOnRenderThread(engine, () => {
    'worklet'
    camera.followManipulator(manipulator)
  })

  manipulator.grabBegin(width / 2, height / 2, false)
  manipulator.grabUpdate(width / 2 + 60, height / 2)
  manipulator.grabEnd()
  manipulator.scroll(width / 2, height / 2, -20)
  return manipulator
}

// After the next frame, manipulator.getLookAt() returns the new pose; jumpToHome() resets it.
`,
  },

  'hybrid-objects/TransformBinding': {
    declarative: `
import React, { useEffect } from 'react'
import { useSharedValue, withRepeat, withTiming } from 'react-native-reanimated'
import { bindSharedValue, ModelRenderer, quaternionFromAxisAngle, useModel, useTransformBinding } from 'react-native-filament'

function SpinningDrone() {
  const drone = useModel(require('./drone.glb'))
  const binding = useTransformBinding(drone.state === 'loaded' ? drone.rootEntity : undefined)
  const angle = useSharedValue(0)

  useEffect(() => {
    angle.value = withRepeat(withTiming(2 * Math.PI, { duration: 4000 }), -1)
  }, [angle])

  useEffect(() => {
    if (binding == null) return
    return bindSharedValue(angle, (radians) => {
      'worklet'
      const [x, y, z, w] = quaternionFromAxisAngle([0, 1, 0], radians)
      binding.setRotation(x, y, z, w)
    })
  }, [binding, angle])

  return <ModelRenderer model={drone} />
}
`,
    imperative: `
import type { SharedValue } from 'react-native-reanimated'
import { bindSharedValue, quaternionFromAxisAngle, runOnRenderThread, unitCubeTransform, type Engine, type Model } from 'react-native-filament'

async function bindRotation(engine: Engine, model: Model, angle: SharedValue<number>) {
  const binding = await runOnRenderThread(engine, () => {
    'worklet'
    return engine.createTransformBinding(model.rootEntity)
  })
  binding.setBase(unitCubeTransform(model.boundingBox))
  binding.setTranslation(0, 0.5, 0)
  binding.setScale(2, 2, 2)
  const unbind = bindSharedValue(angle, (radians) => {
    'worklet'
    const [x, y, z, w] = quaternionFromAxisAngle([0, 1, 0], radians)
    binding.setRotation(x, y, z, w)
  })
  return () => {
    unbind()
    binding.dispose()
  }
}
`,
  },

  'hybrid-objects/ValueBinding': {
    declarative: `
import React from 'react'
import { Button } from 'react-native'
import { useSharedValue, withTiming } from 'react-native-reanimated'
import { useFilamentContext, useRenderThreadEffect, useValueBinding, type Entity } from 'react-native-filament'

function FadeOut({ entity }: { entity: Entity }) {
  const { engine, renderableManager } = useFilamentContext()
  const opacity = useSharedValue(1)
  const alpha = useValueBinding(opacity)

  useRenderThreadEffect(() => {
    'worklet'
    if (alpha == null) return
    const material = renderableManager.getMaterialInstanceAt(entity, 0)
    const subscription = engine.addOnFrameListener(() => {
      material.setFloat4Parameter('baseColorFactor', [1, 1, 1, alpha.value])
      return false
    })
    return () => subscription.remove()
  }, [alpha, engine, renderableManager, entity])

  return <Button title="Fade out" onPress={() => (opacity.value = withTiming(0, { duration: 1000 }))} />
}
`,
    imperative: `
import type { SharedValue } from 'react-native-reanimated'
import { bindSharedValue, runOnRenderThread, type Engine, type MaterialInstance } from 'react-native-filament'

async function followOpacity(engine: Engine, material: MaterialInstance, opacity: SharedValue<number>) {
  const alpha = engine.createValueBinding(opacity.value)
  const unbind = bindSharedValue(opacity, (value) => {
    'worklet'
    alpha.set(value)
  })
  const subscription = await runOnRenderThread(engine, () => {
    'worklet'
    return engine.addOnFrameListener(() => {
      material.setFloat4Parameter('baseColorFactor', [1, 1, 1, alpha.value])
      return false
    })
  })
  return () => {
    unbind()
    subscription.remove()
    alpha.dispose()
  }
}
`,
  },

  'hybrid-objects/Engine': {
    declarative: `
import React, { useEffect } from 'react'
import { Camera, DefaultLight, FilamentScene, FilamentView, Model, useFilamentContext } from 'react-native-filament'

function EngineInfo() {
  const { engine } = useFilamentContext()
  useEffect(() => {
    console.log(engine.backend, engine.getDebugStats().liveResources)
    engine.requestFrame()
  }, [engine])
  return null
}

export function App() {
  return (
    <FilamentScene renderMode="on-demand">
      <FilamentView style={{ flex: 1 }}>
        <Camera />
        <DefaultLight />
        <Model source={require('./drone.glb')} transformToUnitCube />
      </FilamentView>
      <EngineInfo />
    </FilamentScene>
  )
}
`,
    imperative: `
import React, { useEffect, useState } from 'react'
import { callback } from 'react-native-nitro-modules'
import { Filament, NativeFilamentView, runOnRenderThread, type FilamentView } from 'react-native-filament'

export function App() {
  const [view, setView] = useState<FilamentView>()
  useEffect(() => {
    if (view == null) return
    const starting = Filament.createEngine({}).then(async (engine) => {
      engine.renderMode = 'on-demand'
      const target = await engine.createViewTarget(view, { clearOptions: { color: [0.1, 0.1, 0.1, 1] } })
      await runOnRenderThread(engine, () => {
        'worklet'
        target.setScene(engine.createScene())
        target.setCamera(engine.createCamera())
      })
      engine.requestFrame()
      // Keep the target: it stops rendering when it is garbage collected.
      return { engine, target }
    })
    return () => {
      starting.then(({ engine }) => engine.shutdown())
    }
  }, [view])
  return <NativeFilamentView style={{ flex: 1 }} hybridRef={callback(setView)} />
}
`,
  },

  'hybrid-objects/FrameListenerSubscription': {
    declarative: `
import { quaternionFromAxisAngle, useFilamentContext, useRenderThreadEffect, type Entity } from 'react-native-filament'

// useFrameCallback and the renderCallback prop of <FilamentView> manage the subscription for you.
function Spin({ entity }: { entity: Entity }) {
  const { engine, transformManager } = useFilamentContext()
  useRenderThreadEffect(() => {
    'worklet'
    const subscription = engine.addOnFrameListener(({ elapsedSeconds }) => {
      transformManager.setRotation(entity, quaternionFromAxisAngle([0, 1, 0], elapsedSeconds))
      return true
    })
    return () => subscription.remove()
  }, [engine, transformManager, entity])
  return null
}
`,
    imperative: `
import { runOnRenderThread, type Engine, type ViewTarget } from 'react-native-filament'

async function pulseBackground(engine: Engine, target: ViewTarget) {
  const subscription = await runOnRenderThread(engine, () => {
    'worklet'
    return engine.addOnFrameListener(({ elapsedSeconds }) => {
      const level = 0.5 + 0.5 * Math.sin(elapsedSeconds)
      target.setClearOptions({ color: [level, level, level, 1] })
      return true
    })
  })
  return () => subscription.remove()
}
`,
  },

  'hybrid-objects/RenderThread': {
    declarative: `
import { useEffect } from 'react'
import { useFilamentContext, useRenderThreadCallback } from 'react-native-filament'

function ThreadCheck() {
  const { engine } = useFilamentContext()
  const isRenderThread = useRenderThreadCallback(() => {
    'worklet'
    return engine.renderThread.isCurrentThread
  }, [engine])

  useEffect(() => {
    console.log(engine.renderThread.isCurrentThread) // false: this is the JS thread
    isRenderThread().then((value) => console.log(value)) // true
  }, [engine, isRenderThread])
  return null
}
`,
    imperative: `
import { Filament, runOnRenderThread } from 'react-native-filament'

async function inspectRenderThread() {
  const engine = await Filament.createEngine({})
  const thread = engine.renderThread
  console.log(thread.isCurrentThread, thread.hasRuntime) // false, false
  const onRenderThread = await runOnRenderThread(engine, () => {
    'worklet'
    return thread.isCurrentThread
  })
  console.log(onRenderThread, thread.hasRuntime) // true, true
  await engine.shutdown()
}
`,
  },

  'hybrid-objects/FilamentFactory': {
    declarative: `
import React from 'react'
import { Platform, Text } from 'react-native'
import { Camera, DefaultLight, Filament, FilamentScene, FilamentView } from 'react-native-filament'

// Opt into OpenGL ES on Android, for example to work around a Vulkan driver bug.
// Leave backend undefined to use the first supported one: Metal on iOS, Vulkan where available on Android.
const backend = Platform.OS === 'android' && Filament.supportedBackends.includes('opengl') ? 'opengl' : undefined

export function App() {
  return (
    <FilamentScene backend={backend}>
      <FilamentView style={{ flex: 1 }}>
        <Camera />
        <DefaultLight />
      </FilamentView>
      <Text>Filament {Filament.filamentVersion}</Text>
    </FilamentScene>
  )
}
`,
    imperative: `
import { Filament, type Engine } from 'react-native-filament'

async function createEngine(): Promise<Engine> {
  console.log(Filament.filamentVersion, Filament.supportedBackends)
  // Opt into OpenGL ES, for example to work around a Vulkan driver bug.
  // Leave backend undefined to use the first supported one: Metal on iOS, Vulkan where available on Android.
  const backend = Filament.supportedBackends.includes('opengl') ? 'opengl' : undefined
  const engine = await Filament.createEngine({ backend })
  console.log(engine.backend)
  return engine
}
`,
  },

  'hybrid-objects/Material': {
    declarative: `
import { Image } from 'react-native'
import { runOnRenderThread, useDisposableResource, useEntityInScene, useFilamentContext } from 'react-native-filament'

const shadowMaterial = Image.resolveAssetSource(require('./transparent_shadow_material.filamat'))

function ShadowFloor() {
  const { engine, scene } = useFilamentContext()
  const material = useDisposableResource(() => engine.loadMaterial({ uri: shadowMaterial.uri }), [engine])
  const floor = useDisposableResource(async () => {
    if (material == null) return undefined
    return runOnRenderThread(engine, () => {
      'worklet'
      const instance = material.createInstance()
      instance.setFloatParameter('strength', 0.4)
      return engine.createPlane({ width: 10, depth: 10 }, instance)
    })
  }, [engine, material])
  useEntityInScene(scene, floor?.entity)
  return null
}
`,
    imperative: `
import { Image } from 'react-native'
import { runOnRenderThread, type Engine, type Scene } from 'react-native-filament'

const shadowMaterial = Image.resolveAssetSource(require('./transparent_shadow_material.filamat'))

async function addShadowFloor(engine: Engine, scene: Scene) {
  const material = await engine.loadMaterial({ uri: shadowMaterial.uri })
  console.log(material.materialName, material.parameterNames)
  return runOnRenderThread(engine, () => {
    'worklet'
    const instance = material.createInstance()
    instance.setFloatParameter('strength', 0.4)
    const floor = engine.createPlane({ width: 10, depth: 10 }, instance)
    engine.transformManager.setTranslation(floor.entity, [0, -1, 0])
    scene.addEntity(floor.entity)
    return floor
  })
}
`,
  },

  'hybrid-objects/MaterialInstance': {
    declarative: `
import { ModelRenderer, useFilamentContext, useModel, useRenderThreadEffect } from 'react-native-filament'

function RedTipRocket() {
  const rocket = useModel(require('./rocket.glb'))
  const { renderableManager } = useFilamentContext()
  const model = rocket.state === 'loaded' ? rocket.model : undefined

  useRenderThreadEffect(() => {
    'worklet'
    const tip = model?.getEntityByName('Tip')
    if (tip == null) return
    const material = renderableManager.getMaterialInstanceAt(tip, 0)
    const original = material.getFloat4Parameter('baseColorFactor')
    material.setColorParameter('baseColorFactor', [1, 0, 0, 1], 'srgb')
    return () => material.setFloat4Parameter('baseColorFactor', original)
  }, [model, renderableManager])

  return <ModelRenderer model={rocket} />
}
`,
    imperative: `
import { runOnRenderThread, type Engine, type Model, type Texture } from 'react-native-filament'

function restyleTip(engine: Engine, model: Model, texture: Texture) {
  return runOnRenderThread(engine, () => {
    'worklet'
    const tip = model.getEntityByName('Tip')
    if (tip == null) return undefined
    const material = engine.renderableManager.getMaterialInstanceAt(tip, 0)
    if (material.hasParameter('baseColorMap')) {
      material.setTexture('baseColorMap', texture, { wrapS: 'clamp-to-edge', wrapT: 'clamp-to-edge' })
    }
    material.setFloatParameter('roughnessFactor', 0.3)
    material.cullingMode = 'none'
    return { name: material.instanceName, metallic: material.getFloatParameter('metallicFactor') }
  })
}
`,
  },

  'hybrid-objects/Texture': {
    declarative: `
import React from 'react'
import { Image } from 'react-native'
import { EntitySelector, Model, useDisposableResource, useFilamentContext } from 'react-native-filament'

const blue = require('./rocket_blue.png')

export function BlueRocket() {
  return (
    <Model source={require('./rocket.glb')}>
      <EntitySelector byName="Tip" textureMap={{ materialName: 'Toy Ship', textureSource: blue }} />
    </Model>
  )
}

export function useTexture(asset: number) {
  const { engine } = useFilamentContext()
  return useDisposableResource(() => engine.loadTexture({ uri: Image.resolveAssetSource(asset).uri }, { srgb: true }), [engine, asset])
}
`,
    imperative: `
import { Image } from 'react-native'
import { runOnRenderThread, type Engine, type MaterialInstance } from 'react-native-filament'

const photo = Image.resolveAssetSource(require('./photo.jpg'))

async function applyPhoto(engine: Engine, material: MaterialInstance) {
  const texture = await engine.loadTexture({ uri: photo.uri }, { srgb: true })
  console.log(texture.width, texture.height)
  await runOnRenderThread(engine, () => {
    'worklet'
    material.setTexture('baseColorMap', texture, { minFilter: 'linear', wrapS: 'clamp-to-edge', wrapT: 'clamp-to-edge' })
  })
  return texture
}
`,
  },

  'hybrid-objects/CollisionShape': {
    declarative: `
import { useBoxShape, useCylinderShape, useRenderThreadEffect, useRigidBody, useStaticPlaneShape, useWorld } from 'react-native-filament'

function Shapes() {
  const world = useWorld()
  const floor = useStaticPlaneShape(world, [0, 1, 0], 0)
  const crate = useBoxShape(world, [0.5, 0.5, 0.5])
  const coin = useCylinderShape(world, [0.5, 0.05, 0.5], 'y')
  useRigidBody(world, floor == null ? undefined : { shape: floor, mass: 0 })
  useRigidBody(world, crate == null ? undefined : { shape: crate, mass: 2, position: [0, 3, 0] })
  useRigidBody(world, coin == null ? undefined : { shape: coin, mass: 0.1, position: [1, 3, 0] })

  useRenderThreadEffect(() => {
    'worklet'
    if (coin != null) coin.margin = 0.01
  }, [coin])
  return null
}
`,
    imperative: `
import { runOnRenderThread, type Engine } from 'react-native-filament'

function createShapes(engine: Engine) {
  return runOnRenderThread(engine, () => {
    'worklet'
    const world = engine.createPhysicsWorld({})
    const floor = world.createStaticPlaneShape([0, 1, 0], 0)
    const ball = world.createSphereShape(0.5)
    const crate = world.createBoxShape([0.5, 0.5, 0.5])
    const coin = world.createCylinderShape([0.5, 0.05, 0.5], 'y')
    crate.localScaling = [2, 1, 1]
    coin.margin = 0.01
    world.createRigidBody({ shape: floor, mass: 0 })
    world.createRigidBody({ shape: crate, mass: 2, position: [0, 2, 0] })
    return { world, types: [floor.type, ball.type, crate.type, coin.type] }
  })
}
`,
  },

  'hybrid-objects/PhysicsWorld': {
    declarative: `
import { scheduleOnRN } from 'react-native-worklets'
import { useBoxShape, useRenderThreadEffect, useRigidBody, useStaticPlaneShape, useWorld } from 'react-native-filament'

function Physics({ onContact }: { onContact: (ids: string[]) => void }) {
  const world = useWorld({ gravity: [0, -9.81, 0] })
  const floor = useStaticPlaneShape(world, [0, 1, 0], 0)
  const box = useBoxShape(world, [0.5, 0.5, 0.5])
  useRigidBody(world, floor == null ? undefined : { shape: floor, mass: 0, id: 'floor' })
  useRigidBody(world, box == null ? undefined : { shape: box, mass: 1, position: [0, 4, 0], id: 'box' })

  useRenderThreadEffect(() => {
    'worklet'
    if (world == null) return
    const subscription = world.addOnCollisionListener((events) => {
      scheduleOnRN(onContact, events.map((event) => [event.bodyA.id, event.bodyB.id].join('+')))
      return true
    })
    return () => subscription.remove()
  }, [world, onContact])
  return null
}
`,
    imperative: `
import { runOnRenderThread, type Engine, type Model } from 'react-native-filament'

function dropModel(engine: Engine, model: Model) {
  return runOnRenderThread(engine, () => {
    'worklet'
    const world = engine.createPhysicsWorld({ gravity: [0, -9.81, 0], autoStep: false })
    world.createRigidBody({ shape: world.createStaticPlaneShape([0, 1, 0], 0), mass: 0, id: 'floor' })
    const ball = world.createSphereShape(0.5)
    world.createRigidBody({ shape: ball, mass: 1, position: [0, 5, 0], id: 'ball', entity: model.rootEntity })
    world.addOnCollisionListener((events) => {
      const landed = events.some((event) => event.kind === 'began')
      return !landed
    })
    const stepping = engine.addOnFrameListener(({ deltaSeconds }) => {
      world.step(deltaSeconds)
      return true
    })
    // Call stepping.remove() before world.dispose().
    return { world, stepping }
  })
}
`,
  },

  'hybrid-objects/RigidBody': {
    declarative: `
import React from 'react'
import { Button } from 'react-native'
import { useFilamentContext, useRenderThreadCallback, useRigidBody, useSphereShape, type Entity, type PhysicsWorld } from 'react-native-filament'

function Ball({ world, entity }: { world: PhysicsWorld; entity: Entity }) {
  const { engine } = useFilamentContext()
  const shape = useSphereShape(world, 0.5)
  const body = useRigidBody(world, shape == null ? undefined : { shape, mass: 1, position: [0, 4, 0], restitution: 0.6, entity })

  const kick = useRenderThreadCallback(() => {
    'worklet'
    if (body == null) return
    body.activationState = 'active'
    body.applyCentralImpulse([0, 5, 0])
    // Changing a body does not request a frame; on-demand mode needs one to show the change.
    engine.requestFrame()
  }, [body, engine])

  return <Button title="Kick" onPress={() => kick()} />
}
`,
    imperative: `
import { composeTransform, runOnRenderThread, type Engine, type PhysicsWorld, type RigidBody } from 'react-native-filament'

function createBall(engine: Engine, world: PhysicsWorld) {
  return runOnRenderThread(engine, () => {
    'worklet'
    const ball = world.createRigidBody({ shape: world.createSphereShape(0.5), mass: 1, position: [0, 4, 0], id: 'ball' })
    ball.restitution = 0.6
    ball.setDamping(0.1, 0.1)
    ball.applyCentralImpulse([2, 0, 0])
    return ball
  })
}

function resetBall(engine: Engine, ball: RigidBody) {
  return runOnRenderThread(engine, () => {
    'worklet'
    ball.setTransform(composeTransform([0, 4, 0], [0, 0, 0, 1]))
    ball.linearVelocity = [0, 0, 0]
    ball.angularVelocity = [0, 0, 0]
    // Changing a body does not request a frame; on-demand mode needs one to show the change.
    engine.requestFrame()
    return ball.getTransform()
  })
}
`,
  },

  'hybrid-objects/Camera': {
    declarative: `
import React from 'react'
import { Camera, DefaultLight, FilamentScene, FilamentView, Model, useFilamentContext, useRenderThreadEffect } from 'react-native-filament'

function Exposure() {
  const { camera } = useFilamentContext()
  useRenderThreadEffect(() => {
    'worklet'
    camera.setExposure(11, 1 / 125, 100) // one stop brighter than the default f/16, 1/125 s, ISO 100
  }, [camera])
  return null
}

export function App() {
  return (
    <FilamentScene>
      <FilamentView style={{ flex: 1 }}>
        <Camera cameraPosition={[0, 1, 5]} cameraTarget={[0, 0, 0]} focalLengthInMillimeters={35} />
        <Exposure />
        <DefaultLight />
        <Model source={require('./drone.glb')} transformToUnitCube />
      </FilamentView>
    </FilamentScene>
  )
}
`,
    imperative: `
import { runOnRenderThread, type Engine, type ViewTarget } from 'react-native-filament'

async function setUpCamera(engine: Engine, target: ViewTarget) {
  const camera = await runOnRenderThread(engine, () => {
    'worklet'
    const created = engine.createCamera()
    created.lookAt([0, 1, 5], [0, 0, 0], [0, 1, 0])
    created.setExposure(11, 1 / 125, 100) // one stop brighter than the default f/16, 1/125 s, ISO 100
    target.setCamera(created)
    return created
  })
  const subscription = target.addOnResizeListener((width, height) => {
    runOnRenderThread(engine, () => {
      'worklet'
      camera.setLensProjection(28, width / height, 0.1, 100)
    })
  })
  return { camera, subscription }
}
`,
  },

  'hybrid-objects/IndirectLight': {
    declarative: `
import React from 'react'
import { EnvironmentalLight, useIndirectLight } from 'react-native-filament'

export function Studio() {
  return <EnvironmentalLight source={require('./studio_ibl.ktx')} intensity={20_000} />
}

export function useStudioLight() {
  return useIndirectLight(require('./studio_ibl.ktx'), 20_000)
}
`,
    imperative: `
import { Image } from 'react-native'
import { runOnRenderThread, type Engine, type Scene } from 'react-native-filament'

const studio = Image.resolveAssetSource(require('./studio_ibl.ktx'))

async function lightScene(engine: Engine, scene: Scene) {
  const environment = await engine.loadIndirectLight({ uri: studio.uri }, { intensity: 20_000 })
  await runOnRenderThread(engine, () => {
    'worklet'
    scene.setIndirectLight(environment)
  })
  return async () => {
    await runOnRenderThread(engine, () => {
      'worklet'
      scene.setIndirectLight(undefined)
    })
    environment.dispose()
  }
}
`,
  },

  'hybrid-objects/Light': {
    declarative: `
import React from 'react'
import { useSharedValue } from 'react-native-reanimated'
import { Light, useEntityInScene, useFilamentContext, useLightEntity } from 'react-native-filament'

function Lights() {
  const { scene } = useFilamentContext()
  const intensity = useSharedValue(50_000)
  const lamp = useLightEntity({ type: 'point', position: [0, 2, 0], falloffRadius: 5, intensity })
  useEntityInScene(scene, lamp?.entity)

  return (
    <>
      <Light type="directional" direction={[0.3, -1, -0.5]} intensity={10_000} castShadows />
      <Light type="spot" position={[0, 3, 0]} direction={[0, -1, 0]} spotLightCone={[0.3, 0.6]} intensity={80_000} falloffRadius={6} />
    </>
  )
}
`,
    imperative: `
import { runOnRenderThread, type Engine, type Scene } from 'react-native-filament'

function addLights(engine: Engine, scene: Scene) {
  return runOnRenderThread(engine, () => {
    'worklet'
    // A scene uses only its brightest directional or sun light, so add one of them.
    const sun = engine.createSunLight({ direction: [0.4, -1, -0.5], intensityLux: 100_000 })
    const lamp = engine.createPointLight({ position: [0, 2, 0], intensityLumens: 50_000, falloffRadius: 5 })
    const spot = engine.createFocusedSpotLight({ position: [0, 3, 0], direction: [0, -1, 0], outerConeRadians: 0.5, falloffRadius: 6 })
    const lights = [sun, lamp, spot]
    for (const light of lights) scene.addEntity(light.entity)
    return lights
  })
}

// light.type is 'sun', 'point' or 'focused-spot' here; light.dispose() removes it from every scene.
`,
  },

  'hybrid-objects/LightManager': {
    declarative: `
import { kelvinToLinearRgb, useEntityInScene, useFilamentContext, useFrameCallback, useLightEntity } from 'react-native-filament'

function OrbitingLamp() {
  const { scene, lightManager } = useFilamentContext()
  const lamp = useLightEntity({ type: 'point', intensity: 200_000, falloffRadius: 4 })
  const entity = lamp?.entity
  useEntityInScene(scene, entity)

  useFrameCallback(
    ({ elapsedSeconds }) => {
      'worklet'
      if (entity == null) return
      lightManager.setPosition(entity, [Math.cos(elapsedSeconds) * 2, 1, Math.sin(elapsedSeconds) * 2])
      lightManager.setColor(entity, kelvinToLinearRgb(4000 + 2000 * Math.sin(elapsedSeconds)))
    },
    [entity, lightManager]
  )
  return null
}
`,
    imperative: `
import { kelvinToLinearRgb, runOnRenderThread, type Engine, type Light } from 'react-native-filament'

function warmUp(engine: Engine, light: Light) {
  const { entity } = light
  return runOnRenderThread(engine, () => {
    'worklet'
    const lm = engine.lightManager
    const type = lm.getType(entity)
    lm.setColor(entity, kelvinToLinearRgb(2700))
    // Directional and sun lights read and take lux; point and spot lights read candela but take lumens.
    lm.setIntensity(entity, type === 'directional' || type === 'sun' ? lm.getIntensity(entity) * 0.5 : 25_000)
    lm.setShadowCaster(entity, true)
    if (type === 'spot' || type === 'focused-spot') lm.setSpotLightCone(entity, 0.2, 0.6)
    return { position: lm.getPosition(entity), direction: lm.getDirection(entity) }
  })
}
`,
  },

  'hybrid-objects/Renderable': {
    declarative: `
import React from 'react'
import { BackgroundImage, DebugBox, Model } from 'react-native-filament'

export function SceneHelpers() {
  return (
    <>
      <Model source={require('./drone.glb')} transformToUnitCube>
        <DebugBox color={[1, 0, 0, 1]} />
      </Model>
      <DebugBox halfExtent={[2, 0.01, 2]} center={[0, -1, 0]} />
      <BackgroundImage source={require('./photo.jpg')} materialSource={require('./background_image.filamat')} resizeMode="cover" />
    </>
  )
}
`,
    imperative: `
import { runOnRenderThread, type Engine, type Material, type Scene } from 'react-native-filament'

async function showHelpers(engine: Engine, scene: Scene, shadowMaterial: Material) {
  const helpers = await runOnRenderThread(engine, () => {
    'worklet'
    const shadow = shadowMaterial.createInstance()
    shadow.setFloatParameter('strength', 0.4)
    const floor = engine.createPlane({ width: 10, depth: 10, receiveShadows: true }, shadow)
    const bounds = engine.createDebugBox({ halfExtent: [1, 1, 1], color: [0, 1, 0, 1] })
    engine.transformManager.setTranslation(floor.entity, [0, -1, 0])
    scene.addEntity(floor.entity)
    scene.addEntity(bounds.entity)
    return [floor, bounds]
  })
  return () => helpers.forEach((renderable) => renderable.dispose())
}
`,
  },

  'hybrid-objects/RenderableManager': {
    declarative: `
import { ModelRenderer, useFilamentContext, useModel, useRenderThreadEffect } from 'react-native-filament'

function Rocket() {
  const rocket = useModel(require('./rocket.glb'))
  const { renderableManager } = useFilamentContext()
  const model = rocket.state === 'loaded' ? rocket.model : undefined

  useRenderThreadEffect(() => {
    'worklet'
    if (model == null) return
    for (const entity of model.entities) {
      if (!renderableManager.hasComponent(entity)) continue
      renderableManager.setCastShadows(entity, true)
      renderableManager.setPriority(entity, 2)
    }
  }, [model, renderableManager])

  return <ModelRenderer model={rocket} receiveShadow />
}
`,
    imperative: `
import { runOnRenderThread, type Engine, type Material, type Model } from 'react-native-filament'

function replaceWingMaterial(engine: Engine, model: Model, material: Material) {
  return runOnRenderThread(engine, () => {
    'worklet'
    const rm = engine.renderableManager
    const wings = model.getEntityByName('Wings')
    if (wings == null || !rm.hasComponent(wings)) return undefined
    for (let primitive = 0; primitive < rm.getPrimitiveCount(wings); primitive++) {
      rm.setMaterialInstanceAt(wings, primitive, material.createInstance())
    }
    rm.setReceiveShadows(wings, false)
    rm.setCulling(wings, false)
    return rm.getAxisAlignedBoundingBox(wings)
  })
}
`,
  },

  'hybrid-objects/Scene': {
    declarative: `
import React from 'react'
import { Button } from 'react-native'
import { useEntityInScene, useFilamentContext, useLightEntity, useRenderThreadCallback } from 'react-native-filament'

function SceneInfo() {
  const { scene } = useFilamentContext()
  const light = useLightEntity({ type: 'directional', intensity: 10_000 })
  useEntityInScene(scene, light?.entity)

  const countEntities = useRenderThreadCallback(() => {
    'worklet'
    return scene.entityCount
  }, [scene])

  return <Button title="Count entities" onPress={() => countEntities().then(console.log)} />
}
`,
    imperative: `
import { runOnRenderThread, type Engine, type IndirectLight, type Model, type ViewTarget } from 'react-native-filament'

function buildScene(engine: Engine, target: ViewTarget, model: Model, environment: IndirectLight) {
  return runOnRenderThread(engine, () => {
    'worklet'
    const scene = engine.createScene()
    const key = engine.createDirectionalLight({ direction: [0.3, -1, -0.5] })
    scene.addModel(model)
    scene.addEntity(key.entity)
    scene.setIndirectLight(environment)
    scene.setSkybox(engine.createSkybox([0.1, 0.1, 0.12, 1]))
    target.setScene(scene)
    return { scene, key, entityCount: scene.entityCount }
  })
}
`,
  },

  'hybrid-objects/Skybox': {
    declarative: `
import React from 'react'
import { Skybox, useSkybox } from 'react-native-filament'

export function Sky({ night }: { night: boolean }) {
  return night ? <Skybox source={require('./night_skybox.ktx')} /> : <Skybox colorInHex="#88defb" />
}

export function Dusk() {
  useSkybox({ color: [0.25, 0.1, 0.05, 1] })
  return null
}
`,
    imperative: `
import { Image } from 'react-native'
import { runOnRenderThread, type Engine, type Scene } from 'react-native-filament'

const cubemap = Image.resolveAssetSource(require('./default_env_skybox.ktx'))

async function showCubemap(engine: Engine, scene: Scene) {
  const skybox = await engine.loadSkybox({ uri: cubemap.uri })
  await runOnRenderThread(engine, () => {
    'worklet'
    scene.setSkybox(skybox)
  })
  return skybox
}

function showColor(engine: Engine, scene: Scene) {
  return runOnRenderThread(engine, () => {
    'worklet'
    const skybox = engine.createSkybox([0.9, 0.35, 0.05, 1])
    scene.setSkybox(skybox)
    return skybox
  })
}
`,
  },

  'hybrid-objects/TransformManager': {
    declarative: `
import { ModelRenderer, quaternionFromEuler, useFilamentContext, useModel, useRenderThreadEffect } from 'react-native-filament'

function TiltedCoin({ tilt }: { tilt: number }) {
  const coin = useModel(require('./coin.glb'))
  const { transformManager } = useFilamentContext()
  const root = coin.state === 'loaded' ? coin.rootEntity : undefined

  useRenderThreadEffect(() => {
    'worklet'
    if (root == null) return
    transformManager.setRotation(root, quaternionFromEuler([tilt, 0, 0]))
    transformManager.setScale(root, [2, 2, 2])
    return () => transformManager.setScale(root, [1, 1, 1])
  }, [root, tilt, transformManager])

  return <ModelRenderer model={coin} />
}
`,
    imperative: `
import { composeTransform, quaternionFromAxisAngle, runOnRenderThread, type Engine, type Model } from 'react-native-filament'

function placeInstances(engine: Engine, model: Model) {
  return runOnRenderThread(engine, () => {
    'worklet'
    const tm = engine.transformManager
    tm.transformToUnitCube(model.rootEntity, model.boundingBox)
    tm.openLocalTransformTransaction()
    for (let index = 0; index < model.instanceCount; index++) {
      const root = model.getInstance(index).rootEntity
      tm.setTransform(root, composeTransform([index * 2, 0, 0], quaternionFromAxisAngle([0, 1, 0], index)))
    }
    tm.commitLocalTransformTransaction()
    const first = model.getInstance(0).rootEntity
    return { parent: tm.getParent(first), world: tm.getWorldTransform(first) }
  })
}
`,
  },

  'hybrid-objects/View': {
    declarative: `
import React from 'react'
import { Camera, DefaultLight, FilamentScene, FilamentView, Model } from 'react-native-filament'

export function App() {
  return (
    <FilamentScene>
      <FilamentView
        style={{ flex: 1 }}
        antiAliasing="fxaa"
        shadowType="vsm"
        bloomOptions={{ enabled: true, strength: 0.15 }}
        ambientOcclusionOptions={{ enabled: true }}
      >
        <Camera />
        <DefaultLight />
        <Model source={require('./drone.glb')} transformToUnitCube />
      </FilamentView>
    </FilamentScene>
  )
}
`,
    imperative: `
import { runOnRenderThread, type Engine, type ViewTarget } from 'react-native-filament'

function configureView(engine: Engine, target: ViewTarget) {
  const { view } = target
  return runOnRenderThread(engine, () => {
    'worklet'
    view.antiAliasing = 'fxaa'
    view.shadowType = 'vsm'
    view.postProcessing = true
    view.setBloomOptions({ enabled: true, strength: 0.15 })
    view.setAmbientOcclusionOptions({ enabled: true, type: 'gtao', quality: 'high' })
    view.setTemporalAntiAliasingOptions({ enabled: true })
    return view.projectWorldToScreen([0, 1, 0])
  })
}
`,
  },

  'hybrid-objects/Recorder': {
    declarative: `
import React, { useState } from 'react'
import { Button } from 'react-native'
import { Animator, Camera, DefaultLight, Model, useRecorder } from 'react-native-filament'

function Recording({ onRecorded }: { onRecorded: (uri: string) => void }) {
  const recorder = useRecorder({ width: 720, height: 1280, fps: 60, bitRate: 2_000_000 })
  const [recording, setRecording] = useState(false)
  const record = async () => {
    if (recorder == null) return
    setRecording(true)
    onRecorded(await recorder.record(60 * 5))
    setRecording(false)
  }
  return (
    <>
      <Camera aspect={720 / 1280} />
      <DefaultLight />
      <Model source={require('./drone.glb')} transformToUnitCube>
        <Animator />
      </Model>
      <Button title="Record 5 s" disabled={recording || recorder == null} onPress={record} />
    </>
  )
}
`,
    imperative: `
import { runOnRenderThread, type Engine } from 'react-native-filament'

// Use an Engine dedicated to recording: its view targets pause while it records.
async function recordModel(engine: Engine, uri: string, seconds: number): Promise<string> {
  const model = await engine.loadModel({ uri }, {})
  const { recorder, light } = await runOnRenderThread(engine, () => {
    'worklet'
    const created = engine.createRecorder({ width: 720, height: 1280, fps: 30 })
    const scene = engine.createScene()
    const sun = engine.createDirectionalLight({})
    scene.addModel(model)
    scene.addEntity(sun.entity)
    const camera = engine.createCamera()
    camera.lookAt([0, 0, 4], [0, 0, 0], [0, 1, 0])
    camera.setLensProjection(28, created.width / created.height, 0.1, 100)
    created.setScene(scene)
    created.setCamera(camera)
    created.setClearOptions({ color: [0.2, 0.4, 0.8, 1] })
    return { recorder: created, light: sun }
  })
  const player = model.getInstance(0).animator.createPlayer()
  player.play(0, {})
  const video = await recorder.record(recorder.fps * seconds)
  player.dispose()
  light.dispose()
  return video
}
`,
  },

  'hybrid-objects/Snapshot': {
    declarative: `
import React from 'react'
import { Button } from 'react-native'
import { useFilamentContext } from 'react-native-filament'

// Render inside a <FilamentView>, whose target takes the snapshot.
function SnapshotButton({ onSaved }: { onSaved: (uri: string) => void }) {
  const { target } = useFilamentContext()
  const capture = async () => {
    if (target == null) return
    const snapshot = await target.takeSnapshot()
    console.log(snapshot.width, snapshot.height)
    onSaved(await snapshot.saveToTemporaryFile())
  }
  return <Button title="Save snapshot" disabled={target == null} onPress={capture} />
}
`,
    imperative: `
import type { ViewTarget } from 'react-native-filament'

async function captureFrame(target: ViewTarget) {
  const snapshot = await target.takeSnapshot()
  const { width, height } = snapshot
  const pixels = new Uint8Array(snapshot.toArrayBuffer())
  const topLeft = Array.from(pixels.slice(0, 4))
  const uri = await snapshot.saveToTemporaryFile()
  snapshot.dispose()
  return { uri, width, height, topLeft }
}
`,
  },

  'hybrid-objects/ViewTarget': {
    declarative: `
import React, { useEffect } from 'react'
import { Camera, FilamentScene, FilamentView, useFilamentContext } from 'react-native-filament'

function SizeLogger() {
  const { target } = useFilamentContext()
  useEffect(() => {
    if (target == null) return
    const subscription = target.addOnResizeListener((width, height) => console.log(width, height))
    return () => subscription.remove()
  }, [target])
  return null
}

export function App() {
  return (
    <FilamentScene>
      <FilamentView style={{ flex: 1 }} clearOptions={{ color: [0, 0, 0, 1] }} targetFrameRate={30} onFirstFrame={() => console.log('shown')}>
        <Camera />
        <SizeLogger />
      </FilamentView>
    </FilamentScene>
  )
}
`,
    imperative: `
import { runOnRenderThread, type Camera, type Engine, type FilamentView, type Scene, type ViewTarget } from 'react-native-filament'

// \`view\` comes from <NativeFilamentView hybridRef={callback(setView)} />.
async function attachView(engine: Engine, view: FilamentView, scene: Scene, camera: Camera) {
  const target = await engine.createViewTarget(view, { clearOptions: { color: [0, 0, 0, 1] } })
  await runOnRenderThread(engine, () => {
    'worklet'
    target.setScene(scene)
    target.setCamera(camera)
  })
  target.targetFrameRate = 30
  const resize = target.addOnResizeListener((width, height) => {
    runOnRenderThread(engine, () => {
      'worklet'
      camera.setLensProjection(28, width / height, 0.1, 100)
    })
  })
  return { target, resize }
}

async function entityAt(target: ViewTarget, x: number, y: number) {
  const hit = await target.pick(x, y)
  return hit?.entity
}
`,
  },

  'functions/defaultIndirectLightSource': {
    declarative: `
import React from 'react'
import { Camera, defaultIndirectLightSource, EnvironmentalLight, FilamentScene, FilamentView, Light, Model } from 'react-native-filament'

export function App() {
  return (
    <FilamentScene>
      <FilamentView style={{ flex: 1 }}>
        <Camera />
        <EnvironmentalLight source={defaultIndirectLightSource} intensity={30_000} />
        <Light type="directional" intensity={10_000} castShadows />
        <Model source={require('./drone.glb')} transformToUnitCube />
      </FilamentView>
    </FilamentScene>
  )
}
`,
    imperative: `
import { defaultIndirectLightSource, runOnRenderThread, type Engine, type Scene } from 'react-native-filament'

async function addStudioLighting(engine: Engine, scene: Scene) {
  const environment = await engine.loadIndirectLight(defaultIndirectLightSource, { intensity: 30_000 })
  await runOnRenderThread(engine, () => {
    'worklet'
    scene.setIndirectLight(environment)
  })
  return environment
}
`,
  },

  'functions/Filament': {
    declarative: `
import React from 'react'
import { Camera, DefaultLight, Filament, FilamentScene, FilamentView, useEngine } from 'react-native-filament'

// useEngine calls Filament.createEngine and shuts the Engine down on unmount.
export function App() {
  const engine = useEngine(Filament.supportedBackends[0])
  if (engine == null) return null
  return (
    <FilamentScene engine={engine}>
      <FilamentView style={{ flex: 1 }}>
        <Camera />
        <DefaultLight />
      </FilamentView>
    </FilamentScene>
  )
}
`,
    imperative: `
import { Filament } from 'react-native-filament'

async function inspectModel(uri: string) {
  const engine = await Filament.createEngine({ backend: Filament.supportedBackends[0] })
  try {
    const model = await engine.loadModel({ uri }, {})
    return {
      filamentVersion: Filament.filamentVersion,
      entityCount: model.entities.length,
      boundingBox: model.boundingBox,
      animations: model.getInstance(0).animator.animations,
    }
  } finally {
    await engine.shutdown()
  }
}
`,
  },

  'functions/bindSharedValue': {
    declarative: `
import React, { useEffect } from 'react'
import { Button } from 'react-native'
import { useSharedValue, withSequence, withSpring } from 'react-native-reanimated'
import { bindSharedValue, useTransformBinding, type Entity } from 'react-native-filament'

function Jump({ entity }: { entity: Entity }) {
  const height = useSharedValue(0)
  const binding = useTransformBinding(entity)

  useEffect(() => {
    if (binding == null) return
    return bindSharedValue(height, (y) => {
      'worklet'
      binding.setTranslation(0, y, 0)
    })
  }, [binding, height])

  return <Button title="Jump" onPress={() => (height.value = withSequence(withSpring(1), withSpring(0)))} />
}
`,
    imperative: `
import { makeMutable } from 'react-native-reanimated'
import { bindSharedValue, type Engine } from 'react-native-filament'

function createSlider(engine: Engine) {
  const slider = makeMutable(0)
  const binding = engine.createValueBinding(slider.value)
  const unbind = bindSharedValue(slider, (value) => {
    'worklet'
    binding.set(value)
  })
  return {
    slider,
    binding,
    stop: () => {
      unbind()
      binding.dispose()
    },
  }
}
`,
  },

  'functions/composeTransform': {
    declarative: `
import { composeTransform, quaternionFromAxisAngle, useFilamentContext, useRenderThreadEffect, type Entity } from 'react-native-filament'

function Place({ entity, angle }: { entity: Entity; angle: number }) {
  const { transformManager } = useFilamentContext()
  useRenderThreadEffect(() => {
    'worklet'
    const rotation = quaternionFromAxisAngle([0, 1, 0], angle)
    transformManager.setTransform(entity, composeTransform([0, 1, 0], rotation, [2, 2, 2]))
  }, [transformManager, entity, angle])
  return null
}
`,
    imperative: `
import { composeTransform, quaternionFromEuler, runOnRenderThread, type Engine, type Model } from 'react-native-filament'

function layOut(engine: Engine, model: Model) {
  const tilt = quaternionFromEuler([Math.PI / 2, 0, 0])
  return runOnRenderThread(engine, () => {
    'worklet'
    for (let index = 0; index < model.instanceCount; index++) {
      const matrix = composeTransform([index * 1.5, 0, 0], tilt, [0.5, 0.5, 0.5])
      engine.transformManager.setTransform(model.getInstance(index).rootEntity, matrix)
    }
  })
}
`,
  },

  'functions/imageFitTransform': {
    declarative: `
import { useEffect } from 'react'
import { imageFitTransform, useFilamentContext, useRenderThreadCallback, type ImageResizeMode, type MaterialInstance, type Texture } from 'react-native-filament'

// <BackgroundImage resizeMode="cover" /> does this for its own image.
function useImageFit(material: MaterialInstance, image: Texture, resizeMode: ImageResizeMode) {
  const { target } = useFilamentContext()
  const { width: imageWidth, height: imageHeight } = image
  const fit = useRenderThreadCallback(
    (width: number, height: number) => {
      'worklet'
      material.setMat3Parameter('transform', imageFitTransform(imageWidth, imageHeight, width, height, resizeMode))
    },
    [material, imageWidth, imageHeight, resizeMode]
  )

  useEffect(() => {
    const subscription = target?.addOnResizeListener((width, height) => fit(width, height))
    return () => subscription?.remove()
  }, [target, fit])
}
`,
    imperative: `
import { imageFitTransform, runOnRenderThread, type Engine, type MaterialInstance, type Texture, type ViewTarget } from 'react-native-filament'

function fitImage(engine: Engine, target: ViewTarget, background: MaterialInstance, image: Texture) {
  const { width: imageWidth, height: imageHeight } = image
  return target.addOnResizeListener((width, height) => {
    runOnRenderThread(engine, () => {
      'worklet'
      background.setMat3Parameter('transform', imageFitTransform(imageWidth, imageHeight, width, height, 'contain'))
    })
  })
}
`,
  },

  'functions/kelvinToLinearRgb': {
    declarative: `
import React from 'react'
import { EntitySelector, kelvinToLinearRgb, Light, Model } from 'react-native-filament'

export function DeskLamp({ kelvin }: { kelvin: number }) {
  return (
    <>
      <Light type="point" position={[0, 1.2, 0]} colorKelvin={kelvin} intensity={50_000} falloffRadius={4} />
      <Model source={require('./lamp.glb')}>
        <EntitySelector byName="Bulb" materialParameters={{ parameters: { emissiveFactor: kelvinToLinearRgb(kelvin) } }} />
      </Model>
    </>
  )
}
`,
    imperative: `
import { kelvinToLinearRgb, runOnRenderThread, type Engine, type Light } from 'react-native-filament'

function setColorTemperature(engine: Engine, light: Light, kelvin: number) {
  const { entity } = light
  return runOnRenderThread(engine, () => {
    'worklet'
    engine.lightManager.setColor(entity, kelvinToLinearRgb(kelvin))
  })
}
`,
  },

  'functions/lookAtRotation': {
    declarative: `
import { useEffect } from 'react'
import type { SharedValue } from 'react-native-reanimated'
import { bindSharedValue, lookAtRotation, useFilamentContext, useTransformBinding, type Float3 } from 'react-native-filament'

// <Camera cameraPosition={eye} /> does the same for the scene's camera.
function AnimatedCamera({ eye }: { eye: SharedValue<Float3> }) {
  const { camera } = useFilamentContext()
  const binding = useTransformBinding(camera.entity)

  useEffect(() => {
    if (binding == null) return
    return bindSharedValue(eye, (position) => {
      'worklet'
      const [x, y, z, w] = lookAtRotation(position, [0, 0, 0], [0, 1, 0])
      binding.setTranslation(position[0], position[1], position[2])
      binding.setRotation(x, y, z, w)
    })
  }, [binding, eye])
  return null
}
`,
    imperative: `
import { composeTransform, lookAtRotation, runOnRenderThread, type Camera, type Engine, type Float3 } from 'react-native-filament'

function placeCamera(engine: Engine, camera: Camera, eye: Float3, target: Float3) {
  const { entity } = camera
  return runOnRenderThread(engine, () => {
    'worklet'
    // up must not be parallel to eye - target; for a top-down view use [0, 0, -1] instead.
    const rotation = lookAtRotation(eye, target, [0, 1, 0])
    engine.transformManager.setTransform(entity, composeTransform(eye, rotation))
  })
}
`,
  },

  'functions/quaternionFromAxisAngle': {
    declarative: `
import React, { useCallback } from 'react'
import { Camera, DefaultLight, FilamentView, ModelRenderer, quaternionFromAxisAngle, useFilamentContext, useModel, type FrameInfo } from 'react-native-filament'

function Turntable() {
  const { transformManager } = useFilamentContext()
  const drone = useModel(require('./drone.glb'))
  const rootEntity = drone.state === 'loaded' ? drone.rootEntity : undefined
  // renderCallback runs on the render thread, so the TransformManager applies the rotation this frame.
  const renderCallback = useCallback(
    ({ elapsedSeconds }: FrameInfo) => {
      'worklet'
      if (rootEntity == null) return
      transformManager.setRotation(rootEntity, quaternionFromAxisAngle([0, 1, 0], elapsedSeconds * 0.6))
    },
    [transformManager, rootEntity]
  )
  return (
    <FilamentView style={{ flex: 1 }} renderCallback={renderCallback}>
      <Camera />
      <DefaultLight />
      <ModelRenderer model={drone} />
    </FilamentView>
  )
}
`,
    imperative: `
import { quaternionFromAxisAngle, runOnRenderThread, type Engine, type Entity } from 'react-native-filament'

function spin(engine: Engine, entity: Entity, radiansPerSecond: number) {
  return runOnRenderThread(engine, () => {
    'worklet'
    return engine.addOnFrameListener(({ elapsedSeconds }) => {
      engine.transformManager.setRotation(entity, quaternionFromAxisAngle([0, 1, 0], elapsedSeconds * radiansPerSecond))
      return true
    })
  })
}
`,
  },

  'functions/quaternionFromEuler': {
    declarative: `
import { quaternionFromEuler, useBoxShape, useRigidBody, type Entity, type PhysicsWorld } from 'react-native-filament'

function TiltedCrate({ world, entity }: { world: PhysicsWorld; entity: Entity }) {
  const shape = useBoxShape(world, [0.5, 0.5, 0.5])
  const rotation = quaternionFromEuler([0, Math.PI / 4, Math.PI / 8])
  useRigidBody(world, shape == null ? undefined : { shape, mass: 1, position: [0, 3, 0], rotation, entity })
  return null
}
`,
    imperative: `
import { quaternionFromEuler, runOnRenderThread, type Engine, type Entity } from 'react-native-filament'

function tilt(engine: Engine, entity: Entity, degrees: number) {
  const radians = (degrees * Math.PI) / 180
  return runOnRenderThread(engine, () => {
    'worklet'
    engine.transformManager.setRotation(entity, quaternionFromEuler([radians, 0, 0]))
  })
}
`,
  },

  'functions/runOnRenderThread': {
    declarative: `
import React from 'react'
import { Button } from 'react-native'
import { runOnRenderThread, useFilamentContext } from 'react-native-filament'

function CountEntities() {
  const { engine, scene } = useFilamentContext()
  const count = async () => {
    const entities = await runOnRenderThread(engine, () => {
      'worklet'
      return scene.entityCount
    })
    console.log(entities)
  }
  return <Button title="Count entities" onPress={count} />
}
`,
    imperative: `
import { Filament, runOnRenderThread } from 'react-native-filament'

async function createScene() {
  const engine = await Filament.createEngine({})
  const { scene, camera, light } = await runOnRenderThread(engine, () => {
    'worklet'
    const created = engine.createScene()
    const lens = engine.createCamera()
    const sun = engine.createDirectionalLight({})
    lens.lookAt([0, 0, 4], [0, 0, 0], [0, 1, 0])
    created.addEntity(sun.entity)
    return { scene: created, camera: lens, light: sun }
  })
  // Keep the light: the scene stores only its entity.
  return { engine, scene, camera, light }
}
`,
  },

  'functions/unitCubeTransform': {
    declarative: `
import { useEffect } from 'react'
import { ModelRenderer, unitCubeTransform, useModel, useTransformBinding } from 'react-native-filament'

// Same result as <ModelRenderer model={drone} transformToUnitCube scale={[2, 2, 2]} />.
function FittedDrone() {
  const drone = useModel(require('./drone.glb'))
  const loaded = drone.state === 'loaded' ? drone : undefined
  const binding = useTransformBinding(loaded?.rootEntity)

  useEffect(() => {
    if (binding == null || loaded == null) return
    binding.setBase(unitCubeTransform(loaded.boundingBox))
    binding.setScale(2, 2, 2)
  }, [binding, loaded])

  return <ModelRenderer model={drone} />
}
`,
    imperative: `
import { runOnRenderThread, unitCubeTransform, type Engine, type Model } from 'react-native-filament'

function fitAndLift(engine: Engine, model: Model) {
  const fitted = unitCubeTransform(model.boundingBox)
  fitted[13] += 1
  return runOnRenderThread(engine, () => {
    'worklet'
    engine.transformManager.setTransform(model.rootEntity, fitted)
  })
}
`,
  },
}
