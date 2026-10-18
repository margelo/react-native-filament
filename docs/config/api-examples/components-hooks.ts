import type { ApiExample } from './types'

export const componentAndHookExamples: Record<string, ApiExample> = {
  'components/NativeFilamentView': {
    declarative: `import { Camera, FilamentScene, FilamentView } from 'react-native-filament'

export function App() {
  return (
    <FilamentScene>
      <FilamentView style={{ flex: 1 }} clearOptions={{ color: [0.1, 0.1, 0.1, 1] }}>
        <Camera cameraPosition={[0, 0, 4]} />
      </FilamentView>
    </FilamentScene>
  )
}`,
    imperative: `import { useEffect, useState } from 'react'
import { callback } from 'react-native-nitro-modules'
import { Filament, NativeFilamentView, runOnRenderThread, type FilamentView } from 'react-native-filament'

export function App() {
  const [view, setView] = useState<FilamentView>()

  useEffect(() => {
    if (view == null) return
    const starting = Filament.createEngine({}).then(async (engine) => {
      const target = await engine.createViewTarget(view, { clearOptions: { color: [0.1, 0.1, 0.1, 1] } })
      const camera = await runOnRenderThread(engine, () => {
        'worklet'
        const created = engine.createCamera()
        created.lookAt([0, 0, 4], [0, 0, 0], [0, 1, 0])
        target.setScene(engine.createScene())
        target.setCamera(created)
        return created
      })
      const resize = target.addOnResizeListener((width, height) => {
        runOnRenderThread(engine, () => {
          'worklet'
          camera.setLensProjection(28, width / height, 0.1, 100)
        })
      })
      return { engine, target, resize }
    })
    return () => {
      starting.then(({ engine, resize }) => {
        resize.remove()
        engine.shutdown()
      })
    }
  }, [view])

  return <NativeFilamentView style={{ flex: 1 }} hybridRef={callback(setView)} />
}`,
  },

  'components/Animator': {
    declarative: `import { useState } from 'react'
import { Button } from 'react-native'
import { Animator, Camera, DefaultLight, FilamentScene, FilamentView, Model, type AnimationItem } from 'react-native-filament'

export function DroneAnimations() {
  const [animations, setAnimations] = useState<AnimationItem[]>([])
  const [index, setIndex] = useState(0)

  return (
    <FilamentScene>
      <FilamentView style={{ flex: 1 }}>
        <Camera />
        <DefaultLight />
        <Model source={require('./assets/drone.glb')} transformToUnitCube>
          <Animator animationIndex={index} transitionDuration={0.5} onAnimationsLoaded={setAnimations} />
        </Model>
      </FilamentView>
      <Button title="Next animation" onPress={() => setIndex((index + 1) % Math.max(animations.length, 1))} />
    </FilamentScene>
  )
}`,
    imperative: `import { useEffect, useMemo, useState } from 'react'
import { Button } from 'react-native'
import type { AnimationPlayer, Model } from 'react-native-filament'

function DroneAnimations({ model }: { model: Model }) {
  const animations = useMemo(() => model.getInstance(0).animator.animations, [model])
  const [player, setPlayer] = useState<AnimationPlayer>()
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const created = model.getInstance(0).animator.createPlayer()
    setPlayer(created)
    return () => created.dispose()
  }, [model])

  useEffect(() => {
    player?.play(index, { loop: true, speed: 1, crossFadeSeconds: 0.5 })
  }, [player, index])

  return <Button title="Next animation" onPress={() => setIndex((index + 1) % Math.max(animations.length, 1))} />
}`,
  },

  'components/BackgroundImage': {
    declarative: `import { BackgroundImage, Camera, DefaultLight, FilamentScene, FilamentView, Model } from 'react-native-filament'

export function App() {
  return (
    <FilamentScene>
      <FilamentView style={{ flex: 1 }}>
        <Camera />
        <DefaultLight />
        <Model source={require('./assets/drone.glb')} transformToUnitCube />
        <BackgroundImage
          source={require('./assets/background.jpg')}
          materialSource={require('./assets/background_image.filamat')}
          resizeMode="cover"
        />
      </FilamentView>
    </FilamentScene>
  )
}`,
    imperative: `import { useEffect } from 'react'
import { Image } from 'react-native'
import { imageFitTransform, runOnRenderThread, useFilamentContext } from 'react-native-filament'

const photo = Image.resolveAssetSource(require('./assets/background.jpg'))
const backgroundMaterial = Image.resolveAssetSource(require('./assets/background_image.filamat'))

function Background() {
  const { engine, scene, target } = useFilamentContext()

  useEffect(() => {
    if (target == null) return
    const loading = Promise.all([
      engine.loadTexture({ uri: photo.uri }, {}),
      engine.loadMaterial({ uri: backgroundMaterial.uri }),
    ]).then(async ([image, material]) => {
      const { instance, background } = await runOnRenderThread(engine, () => {
        'worklet'
        const created = material.createInstance()
        created.setTexture('image', image, {})
        created.setIntParameter('showImage', 1)
        created.setFloat3Parameter('backgroundColor', [0, 0, 0])
        const renderable = engine.createBackground(created)
        scene.addEntity(renderable.entity)
        return { instance: created, background: renderable }
      })
      const resize = target.addOnResizeListener((width, height) => {
        const fit = imageFitTransform(image.width, image.height, width, height, 'cover')
        runOnRenderThread(engine, () => {
          'worklet'
          instance.setMat3Parameter('transform', fit)
        })
      })
      return () => {
        resize.remove()
        background.dispose()
        material.dispose()
        image.dispose()
      }
    })
    return () => {
      loading.then((release) => release())
    }
  }, [engine, scene, target])

  return null
}`,
  },

  'components/Camera': {
    declarative: `import { Camera, DefaultLight, FilamentScene, FilamentView, Model } from 'react-native-filament'

export function App() {
  return (
    <FilamentScene>
      <FilamentView style={{ flex: 1 }}>
        <Camera cameraPosition={[0, 2, 6]} cameraTarget={[0, 0, 0]} focalLengthInMillimeters={35} near={0.1} far={100} />
        <DefaultLight />
        <Model source={require('./assets/drone.glb')} transformToUnitCube />
      </FilamentView>
    </FilamentScene>
  )
}`,
    imperative: `import { useEffect } from 'react'
import { runOnRenderThread, useFilamentContext } from 'react-native-filament'

function CameraRig() {
  const { engine, camera, target } = useFilamentContext()

  useEffect(() => {
    runOnRenderThread(engine, () => {
      'worklet'
      camera.lookAt([0, 2, 6], [0, 0, 0], [0, 1, 0])
    })
  }, [engine, camera])

  useEffect(() => {
    if (target == null) return
    const subscription = target.addOnResizeListener((width, height) => {
      runOnRenderThread(engine, () => {
        'worklet'
        camera.setLensProjection(35, width / height, 0.1, 100)
      })
    })
    return () => subscription.remove()
  }, [engine, camera, target])

  return null
}`,
  },

  'components/DebugBox': {
    declarative: `import { Camera, DebugBox, DefaultLight, FilamentScene, FilamentView, Model } from 'react-native-filament'

export function App() {
  return (
    <FilamentScene>
      <FilamentView style={{ flex: 1 }}>
        <Camera />
        <DefaultLight />
        <Model source={require('./assets/drone.glb')} transformToUnitCube>
          <DebugBox color={[1, 0, 0, 1]} />
        </Model>
      </FilamentView>
    </FilamentScene>
  )
}`,
    imperative: `import { useEffect } from 'react'
import { runOnRenderThread, useFilamentContext, type Model } from 'react-native-filament'

function Bounds({ model }: { model: Model }) {
  const { engine, scene, transformManager } = useFilamentContext()

  useEffect(() => {
    const { center, halfExtent } = model.boundingBox
    const creating = runOnRenderThread(engine, () => {
      'worklet'
      const box = engine.createDebugBox({ halfExtent, center, color: [1, 0, 0, 1] })
      transformManager.setParent(box.entity, model.rootEntity)
      scene.addEntity(box.entity)
      return box
    })
    return () => {
      creating.then((box) => box.dispose())
    }
  }, [engine, scene, transformManager, model])

  return null
}`,
  },

  'components/DefaultLight': {
    declarative: `import { Camera, DefaultLight, FilamentScene, FilamentView, Model } from 'react-native-filament'

export function App() {
  return (
    <FilamentScene>
      <FilamentView style={{ flex: 1 }}>
        <Camera />
        <DefaultLight />
        <Model source={require('./assets/drone.glb')} transformToUnitCube />
      </FilamentView>
    </FilamentScene>
  )
}`,
    imperative: `import { useEffect } from 'react'
import { defaultIndirectLightSource, runOnRenderThread, useFilamentContext } from 'react-native-filament'

function StudioLights() {
  const { engine, scene } = useFilamentContext()

  useEffect(() => {
    const creating = engine.loadIndirectLight(defaultIndirectLightSource, { intensity: 25_000 }).then((environment) =>
      runOnRenderThread(engine, () => {
        'worklet'
        const sun = engine.createDirectionalLight({ intensityLux: 10_000, colorKelvin: 6_500, castShadows: true })
        scene.setIndirectLight(environment)
        scene.addEntity(sun.entity)
        return { environment, sun }
      })
    )
    return () => {
      creating.then(({ environment, sun }) => {
        environment.dispose()
        sun.dispose()
      })
    }
  }, [engine, scene])

  return null
}`,
  },

  'components/EntitySelector': {
    declarative: `import { Camera, DefaultLight, EntitySelector, FilamentScene, FilamentView, Model } from 'react-native-filament'

export function Car() {
  return (
    <FilamentScene>
      <FilamentView style={{ flex: 1 }}>
        <Camera />
        <DefaultLight />
        <Model source={require('./assets/car.glb')} transformToUnitCube>
          <EntitySelector byName="Body" materialParameters={{ parameters: { baseColorFactor: [0.8, 0.1, 0.1, 1], metallicFactor: 0.9 } }} />
          <EntitySelector byName="Spoiler" textureMap={{ materialName: 'Carbon', textureSource: require('./assets/carbon.png') }} />
        </Model>
      </FilamentView>
    </FilamentScene>
  )
}`,
    imperative: `import { useEffect } from 'react'
import { Image } from 'react-native'
import { runOnRenderThread, useFilamentContext, type Model } from 'react-native-filament'

const carbon = Image.resolveAssetSource(require('./assets/carbon.png'))

function CarPaint({ model }: { model: Model }) {
  const { engine, renderableManager } = useFilamentContext()

  useEffect(() => {
    const loading = engine.loadTexture({ uri: carbon.uri }, {}).then(async (texture) => {
      await runOnRenderThread(engine, () => {
        'worklet'
        const body = model.getEntityByName('Body')
        if (body == null) throw new Error('No entity named "Body"')
        const paint = renderableManager.getMaterialInstanceAt(body, 0)
        paint.setFloat4Parameter('baseColorFactor', [0.8, 0.1, 0.1, 1])
        paint.setFloatParameter('metallicFactor', 0.9)
        const spoiler = model.getEntityByName('Spoiler')
        if (spoiler == null) throw new Error('No entity named "Spoiler"')
        for (let index = 0; index < renderableManager.getPrimitiveCount(spoiler); index++) {
          const instance = renderableManager.getMaterialInstanceAt(spoiler, index)
          if (instance.instanceName === 'Carbon') instance.setTexture('baseColorMap', texture, {})
        }
      })
      return texture
    })
    return () => {
      loading.then((texture) => texture.dispose())
    }
  }, [engine, renderableManager, model])

  return null
}`,
  },

  'components/EnvironmentalLight': {
    declarative: `import { Camera, EnvironmentalLight, FilamentScene, FilamentView, Model } from 'react-native-filament'

export function App() {
  return (
    <FilamentScene>
      <FilamentView style={{ flex: 1 }}>
        <Camera />
        <EnvironmentalLight source={require('./assets/environment_ibl.ktx')} intensity={30_000} />
        <Model source={require('./assets/drone.glb')} transformToUnitCube />
      </FilamentView>
    </FilamentScene>
  )
}`,
    imperative: `import { useEffect } from 'react'
import { Image } from 'react-native'
import { runOnRenderThread, useFilamentContext } from 'react-native-filament'

const environment = Image.resolveAssetSource(require('./assets/environment_ibl.ktx'))

function Environment() {
  const { engine, scene } = useFilamentContext()

  useEffect(() => {
    const loading = engine.loadIndirectLight({ uri: environment.uri }, { intensity: 30_000 }).then(async (light) => {
      await runOnRenderThread(engine, () => {
        'worklet'
        scene.setIndirectLight(light)
      })
      return light
    })
    return () => {
      loading.then((light) => light.dispose())
    }
  }, [engine, scene])

  return null
}`,
  },

  'components/FilamentScene': {
    declarative: `import { ActivityIndicator } from 'react-native'
import { Camera, DefaultLight, FilamentScene, FilamentView, Model } from 'react-native-filament'

export function App() {
  return (
    <FilamentScene renderMode="on-demand" fallback={<ActivityIndicator />}>
      <FilamentView style={{ flex: 1 }}>
        <Camera />
        <DefaultLight />
        <Model source={require('./assets/drone.glb')} transformToUnitCube />
      </FilamentView>
    </FilamentScene>
  )
}`,
    imperative: `import { useEffect, useState } from 'react'
import { Filament, runOnRenderThread, type Camera, type Engine, type Scene } from 'react-native-filament'

export function useFilamentObjects() {
  const [objects, setObjects] = useState<{ engine: Engine; scene: Scene; camera: Camera }>()

  useEffect(() => {
    let active = true
    const starting = Filament.createEngine({}).then(async (engine) => {
      engine.renderMode = 'on-demand'
      const { scene, camera } = await runOnRenderThread(engine, () => {
        'worklet'
        return { scene: engine.createScene(), camera: engine.createCamera() }
      })
      if (active) setObjects({ engine, scene, camera })
      return engine
    })
    return () => {
      active = false
      setObjects(undefined)
      starting.then((engine) => engine.shutdown())
    }
  }, [])

  return objects
}`,
  },

  'components/FilamentView': {
    declarative: `import { Camera, DefaultLight, FilamentScene, FilamentView, Model } from 'react-native-filament'

export function App() {
  return (
    <FilamentScene>
      <FilamentView
        style={{ flex: 1 }}
        clearOptions={{ color: [0.1, 0.1, 0.1, 1] }}
        targetFrameRate={30}
        shadowType="vsm"
        bloomOptions={{ enabled: true, strength: 0.2 }}
      >
        <Camera />
        <DefaultLight />
        <Model source={require('./assets/drone.glb')} transformToUnitCube />
      </FilamentView>
    </FilamentScene>
  )
}`,
    imperative: `import { useEffect, useState } from 'react'
import { callback } from 'react-native-nitro-modules'
import { NativeFilamentView, runOnRenderThread, useFilamentContext, type FilamentView } from 'react-native-filament'

function SceneView() {
  const { engine, scene, camera } = useFilamentContext()
  const [view, setView] = useState<FilamentView>()

  useEffect(() => {
    if (view == null) return
    const creating = engine.createViewTarget(view, { clearOptions: { color: [0.1, 0.1, 0.1, 1] } }).then(async (target) => {
      target.targetFrameRate = 30
      await runOnRenderThread(engine, () => {
        'worklet'
        target.setScene(scene)
        target.setCamera(camera)
        target.view.shadowType = 'vsm'
        target.view.setBloomOptions({ enabled: true, strength: 0.2 })
      })
      const resize = target.addOnResizeListener((width, height) => {
        runOnRenderThread(engine, () => {
          'worklet'
          camera.setLensProjection(28, width / height, 0.1, 100)
        })
      })
      return { target, resize }
    })
    return () => {
      creating.then(({ target, resize }) => {
        resize.remove()
        target.dispose()
      })
    }
  }, [engine, scene, camera, view])

  return <NativeFilamentView style={{ flex: 1 }} hybridRef={callback(setView)} />
}`,
  },

  'components/Light': {
    declarative: `import { Camera, FilamentScene, FilamentView, Light, Model } from 'react-native-filament'

export function App() {
  return (
    <FilamentScene>
      <FilamentView style={{ flex: 1 }}>
        <Camera cameraPosition={[0, 2, 6]} />
        <Light type="point" position={[0, 2, 1]} intensity={50_000} falloffRadius={10} colorKelvin={3_000} />
        <Model source={require('./assets/drone.glb')} transformToUnitCube />
      </FilamentView>
    </FilamentScene>
  )
}`,
    imperative: `import { useEffect } from 'react'
import { runOnRenderThread, useFilamentContext } from 'react-native-filament'

function Lamp() {
  const { engine, scene } = useFilamentContext()

  useEffect(() => {
    const creating = runOnRenderThread(engine, () => {
      'worklet'
      const light = engine.createPointLight({ position: [0, 2, 1], intensityLumens: 50_000, falloffRadius: 10, colorKelvin: 3_000 })
      scene.addEntity(light.entity)
      return light
    })
    return () => {
      creating.then((light) => light.dispose())
    }
  }, [engine, scene])

  return null
}`,
  },

  'components/Model': {
    declarative: `import { Camera, DefaultLight, FilamentScene, FilamentView, Model } from 'react-native-filament'

export function App() {
  return (
    <FilamentScene>
      <FilamentView style={{ flex: 1 }}>
        <Camera />
        <DefaultLight />
        <Model source={require('./assets/drone.glb')} transformToUnitCube castShadow />
      </FilamentView>
    </FilamentScene>
  )
}`,
    imperative: `import { useEffect } from 'react'
import { Image } from 'react-native'
import { runOnRenderThread, useFilamentContext } from 'react-native-filament'

const drone = Image.resolveAssetSource(require('./assets/drone.glb'))

function Drone() {
  const { engine, scene, transformManager, renderableManager } = useFilamentContext()

  useEffect(() => {
    const loading = engine.loadModel({ uri: drone.uri }, {}).then(async (model) => {
      await runOnRenderThread(engine, () => {
        'worklet'
        transformManager.transformToUnitCube(model.rootEntity, model.boundingBox)
        for (const entity of model.entities) {
          if (renderableManager.hasComponent(entity)) renderableManager.setCastShadows(entity, true)
        }
        scene.addModel(model)
      })
      return model
    })
    return () => {
      loading.then((model) => model.dispose())
    }
  }, [engine, scene, transformManager, renderableManager])

  return null
}`,
  },

  'components/ModelInstance': {
    declarative: `import { Camera, DefaultLight, FilamentScene, FilamentView, Model, ModelInstance } from 'react-native-filament'

export function Coins() {
  return (
    <FilamentScene>
      <FilamentView style={{ flex: 1 }}>
        <Camera />
        <DefaultLight />
        <Model source={require('./assets/coin.glb')} instanceCount={3}>
          <ModelInstance index={0} translate={[-1.5, 0, 0]} />
          <ModelInstance index={1} rotate={[Math.PI / 2, 0, 0]} />
          <ModelInstance index={2} translate={[1.5, 0, 0]} scale={[0.5, 0.5, 0.5]} />
        </Model>
      </FilamentView>
    </FilamentScene>
  )
}`,
    imperative: `import { useEffect } from 'react'
import { Image } from 'react-native'
import { quaternionFromEuler, runOnRenderThread, useFilamentContext } from 'react-native-filament'

const coin = Image.resolveAssetSource(require('./assets/coin.glb'))

function Coins() {
  const { engine, scene, transformManager } = useFilamentContext()

  useEffect(() => {
    const loading = engine.loadModel({ uri: coin.uri }, { instanceCount: 3 }).then(async (model) => {
      await runOnRenderThread(engine, () => {
        'worklet'
        transformManager.setTranslation(model.getInstance(0).rootEntity, [-1.5, 0, 0])
        transformManager.setRotation(model.getInstance(1).rootEntity, quaternionFromEuler([Math.PI / 2, 0, 0]))
        transformManager.setTranslation(model.getInstance(2).rootEntity, [1.5, 0, 0])
        transformManager.setScale(model.getInstance(2).rootEntity, [0.5, 0.5, 0.5])
        scene.addModel(model)
      })
      return model
    })
    return () => {
      loading.then((model) => model.dispose())
    }
  }, [engine, scene, transformManager])

  return null
}`,
  },

  'components/ModelRenderer': {
    declarative: `import { ModelRenderer, useModel } from 'react-native-filament'

function Drone() {
  const model = useModel(require('./assets/drone.glb'))
  return <ModelRenderer model={model} transformToUnitCube translate={[0, 0.5, 0]} receiveShadow={false} />
}`,
    imperative: `import { useEffect } from 'react'
import { runOnRenderThread, unitCubeTransform, useFilamentContext, type Model } from 'react-native-filament'

function PlacedModel({ model }: { model: Model }) {
  const { engine, renderableManager, transformManager } = useFilamentContext()

  useEffect(() => {
    const base = unitCubeTransform(model.boundingBox)
    const binding = runOnRenderThread(engine, () => {
      'worklet'
      for (const entity of model.entities) {
        if (renderableManager.hasComponent(entity)) renderableManager.setReceiveShadows(entity, false)
      }
      const created = engine.createTransformBinding(model.rootEntity)
      created.setBase(base)
      created.setTranslation(0, 0.5, 0)
      return created
    })
    return () => {
      binding.then((created) => {
        created.dispose()
        // Give the root entity back its original transform.
        runOnRenderThread(engine, () => {
          'worklet'
          transformManager.setTransform(model.rootEntity, [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1])
        })
      })
    }
  }, [engine, renderableManager, transformManager, model])

  return null
}`,
  },

  'components/Skybox': {
    declarative: `import { Camera, DefaultLight, FilamentScene, FilamentView, Model, Skybox } from 'react-native-filament'

export function App() {
  return (
    <FilamentScene>
      <FilamentView style={{ flex: 1 }}>
        <Camera />
        <DefaultLight />
        <Skybox source={require('./assets/skybox.ktx')} />
        <Model source={require('./assets/drone.glb')} transformToUnitCube />
      </FilamentView>
    </FilamentScene>
  )
}`,
    imperative: `import { useEffect } from 'react'
import { Image } from 'react-native'
import { runOnRenderThread, useFilamentContext } from 'react-native-filament'

const cubemap = Image.resolveAssetSource(require('./assets/skybox.ktx'))

function Sky() {
  const { engine, scene } = useFilamentContext()

  useEffect(() => {
    const loading = engine.loadSkybox({ uri: cubemap.uri }).then(async (skybox) => {
      await runOnRenderThread(engine, () => {
        'worklet'
        scene.setSkybox(skybox)
      })
      return skybox
    })
    return () => {
      loading.then((skybox) => skybox.dispose())
    }
  }, [engine, scene])

  return null
}`,
  },

  'hooks/useAnimationPlayer': {
    declarative: `import { useEffect, useMemo } from 'react'
import { Button } from 'react-native'
import { useAnimationPlayer, type Model } from 'react-native-filament'

function Playback({ model }: { model: Model }) {
  const instance = useMemo(() => model.getInstance(0), [model])
  const player = useAnimationPlayer(instance)

  useEffect(() => {
    player?.play(0, { loop: true, speed: 0.5 })
  }, [player])

  return (
    <>
      <Button title="Pause" onPress={() => player?.pause()} />
      <Button title="Rewind" onPress={() => player?.seek(0)} />
    </>
  )
}`,
    imperative: `import { useEffect, useState } from 'react'
import { Button } from 'react-native'
import type { AnimationPlayer, Model } from 'react-native-filament'

function Playback({ model }: { model: Model }) {
  const [player, setPlayer] = useState<AnimationPlayer>()

  useEffect(() => {
    const created = model.getInstance(0).animator.createPlayer()
    created.play(0, { loop: true, speed: 0.5 })
    setPlayer(created)
    return () => {
      setPlayer(undefined)
      created.dispose()
    }
  }, [model])

  return (
    <>
      <Button title="Pause" onPress={() => player?.pause()} />
      <Button title="Rewind" onPress={() => player?.seek(0)} />
    </>
  )
}`,
  },

  'hooks/useAnimator': {
    declarative: `import { ModelRenderer, useAnimator, useFrameCallback, useModel } from 'react-native-filament'

function Drone() {
  const model = useModel(require('./assets/drone.glb'))
  const animator = useAnimator(model)
  const duration = animator?.animations[0]?.durationSeconds ?? 1

  useFrameCallback(
    ({ elapsedSeconds }) => {
      'worklet'
      if (animator == null) return
      animator.applyAnimation(0, elapsedSeconds % duration)
      animator.updateBoneMatrices()
    },
    [animator, duration]
  )

  return <ModelRenderer model={model} transformToUnitCube />
}`,
    imperative: `import { useEffect } from 'react'
import { runOnRenderThread, useFilamentContext, type Model } from 'react-native-filament'

function DroneAnimation({ model }: { model: Model }) {
  const { engine } = useFilamentContext()

  useEffect(() => {
    const animator = model.getInstance(0).animator
    const duration = animator.animations[0]?.durationSeconds ?? 1
    const subscribing = runOnRenderThread(engine, () => {
      'worklet'
      return engine.addOnFrameListener(({ elapsedSeconds }) => {
        animator.applyAnimation(0, elapsedSeconds % duration)
        animator.updateBoneMatrices()
        return true
      })
    })
    return () => {
      subscribing.then((subscription) => subscription.remove())
    }
  }, [engine, model])

  return null
}`,
  },

  'hooks/useBoxShape': {
    declarative: `import { useBoxShape, useRigidBody, type Entity, type PhysicsWorld } from 'react-native-filament'

function Crate({ world, entity }: { world: PhysicsWorld | undefined; entity: Entity }) {
  const shape = useBoxShape(world, [0.5, 0.5, 0.5])
  useRigidBody(world, shape == null ? undefined : { shape, mass: 2, position: [0, 4, 0], entity })
  return null
}`,
    imperative: `import { useEffect } from 'react'
import { runOnRenderThread, useFilamentContext, type Entity, type PhysicsWorld } from 'react-native-filament'

function Crate({ world, entity }: { world: PhysicsWorld; entity: Entity }) {
  const { engine } = useFilamentContext()

  useEffect(() => {
    const creating = runOnRenderThread(engine, () => {
      'worklet'
      const shape = world.createBoxShape([0.5, 0.5, 0.5])
      return world.createRigidBody({ shape, mass: 2, position: [0, 4, 0], entity })
    })
    return () => {
      creating.then((body) => body.dispose())
    }
  }, [engine, world, entity])

  return null
}`,
  },

  'hooks/useCameraManipulator': {
    declarative: `import { Camera, useCameraManipulator } from 'react-native-filament'

function OrbitCamera() {
  const manipulator = useCameraManipulator({ homePosition: [0, 1, 6], targetPosition: [0, 0, 0], orbitSpeed: 0.003 })
  if (manipulator == null) return null
  return <Camera cameraManipulator={manipulator} />
}`,
    imperative: `import { useEffect } from 'react'
import { PixelRatio } from 'react-native'
import { runOnRenderThread, useFilamentContext } from 'react-native-filament'

function OrbitCamera() {
  const { engine, camera, target } = useFilamentContext()

  useEffect(() => {
    if (target == null) return
    const manipulator = engine.createOrbitManipulator({ homePosition: [0, 1, 6], targetPosition: [0, 0, 0], orbitSpeed: 0.003 })
    runOnRenderThread(engine, () => {
      'worklet'
      camera.followManipulator(manipulator)
    })
    const resize = target.addOnResizeListener((width, height) => {
      manipulator.setViewport(width / PixelRatio.get(), height / PixelRatio.get())
      runOnRenderThread(engine, () => {
        'worklet'
        camera.setLensProjection(28, width / height, 0.1, 100)
      })
    })
    return () => {
      resize.remove()
      runOnRenderThread(engine, () => {
        'worklet'
        camera.followManipulator(undefined)
      }).then(() => manipulator.dispose())
    }
  }, [engine, camera, target])

  return null
}`,
  },

  'hooks/useConfigureAssetShadow': {
    declarative: `import { useMemo } from 'react'
import { ModelRenderer, useConfigureAssetShadow, useModel } from 'react-native-filament'

function Drone() {
  const model = useModel(require('./assets/drone.glb'))
  const entities = useMemo(() => (model.state === 'loaded' ? model.model.entities : undefined), [model])
  useConfigureAssetShadow({ entities, castShadow: true, receiveShadow: false })
  return <ModelRenderer model={model} transformToUnitCube />
}`,
    imperative: `import { useEffect } from 'react'
import { runOnRenderThread, useFilamentContext, type Model } from 'react-native-filament'

function DroneShadows({ model }: { model: Model }) {
  const { engine, renderableManager } = useFilamentContext()

  useEffect(() => {
    runOnRenderThread(engine, () => {
      'worklet'
      for (const entity of model.entities) {
        if (!renderableManager.hasComponent(entity)) continue
        renderableManager.setCastShadows(entity, true)
        renderableManager.setReceiveShadows(entity, false)
      }
    })
  }, [engine, renderableManager, model])

  return null
}`,
  },

  'hooks/useCylinderShape': {
    declarative: `import { useCylinderShape, useRigidBody, type Model, type PhysicsWorld } from 'react-native-filament'

function Coin({ world, model }: { world: PhysicsWorld | undefined; model: Model }) {
  const [x, y, z] = model.boundingBox.halfExtent
  const shape = useCylinderShape(world, [x, y, z], 'y')
  useRigidBody(world, shape == null ? undefined : { shape, mass: 1, position: [0, 3, 0], friction: 0.8, entity: model.rootEntity })
  return null
}`,
    imperative: `import { useEffect } from 'react'
import { runOnRenderThread, useFilamentContext, type Model, type PhysicsWorld } from 'react-native-filament'

function Coin({ world, model }: { world: PhysicsWorld; model: Model }) {
  const { engine } = useFilamentContext()

  useEffect(() => {
    const { halfExtent } = model.boundingBox
    const creating = runOnRenderThread(engine, () => {
      'worklet'
      const shape = world.createCylinderShape(halfExtent, 'y')
      return world.createRigidBody({ shape, mass: 1, position: [0, 3, 0], friction: 0.8, entity: model.rootEntity })
    })
    return () => {
      creating.then((body) => body.dispose())
    }
  }, [engine, world, model])

  return null
}`,
  },

  'hooks/useDisposableResource': {
    declarative: `import { useDisposableResource, useFilamentContext } from 'react-native-filament'

export function useTexture(uri: string) {
  const { engine } = useFilamentContext()
  return useDisposableResource(() => engine.loadTexture({ uri }, { srgb: true }), [engine, uri])
}`,
    imperative: `import { useEffect, useState } from 'react'
import { useFilamentContext, type Texture } from 'react-native-filament'

export function useTexture(uri: string) {
  const { engine } = useFilamentContext()
  const [texture, setTexture] = useState<Texture>()

  useEffect(() => {
    let active = true
    const loading = engine.loadTexture({ uri }, { srgb: true })
    loading.then((loaded) => {
      if (active) setTexture(loaded)
    })
    return () => {
      active = false
      setTexture(undefined)
      loading.then((loaded) => loaded.dispose())
    }
  }, [engine, uri])

  return texture
}`,
  },

  'hooks/useEngine': {
    declarative: `import { FlatList } from 'react-native'
import { Camera, DefaultLight, FilamentScene, FilamentView, Model, useEngine } from 'react-native-filament'

export function Gallery({ sources }: { sources: number[] }) {
  const engine = useEngine()
  if (engine == null) return null
  return (
    <FlatList
      data={sources}
      keyExtractor={(_, index) => String(index)}
      renderItem={({ item }) => (
        <FilamentScene engine={engine}>
          <FilamentView style={{ height: 200 }}>
            <Camera />
            <DefaultLight />
            <Model source={item} transformToUnitCube />
          </FilamentView>
        </FilamentScene>
      )}
    />
  )
}`,
    imperative: `import { useEffect, useState } from 'react'
import { Filament, type Engine } from 'react-native-filament'

export function useSharedEngine() {
  const [engine, setEngine] = useState<Engine>()

  useEffect(() => {
    let active = true
    const creating = Filament.createEngine({ backend: Filament.supportedBackends[0] })
    creating.then((created) => {
      if (active) setEngine(created)
    })
    return () => {
      active = false
      setEngine(undefined)
      creating.then((created) => created.shutdown())
    }
  }, [])

  return engine
}`,
  },

  'hooks/useEntityInScene': {
    declarative: `import { useDisposableResource, useEntityInScene, useFilamentContext, useRenderThreadCallback } from 'react-native-filament'

function Marker() {
  const { engine, scene } = useFilamentContext()
  const createBox = useRenderThreadCallback(() => {
    'worklet'
    return engine.createDebugBox({ halfExtent: [0.5, 0.5, 0.5], color: [1, 0, 0, 1] })
  }, [engine])
  const box = useDisposableResource(() => createBox(), [createBox])
  useEntityInScene(scene, box?.entity)
  return null
}`,
    imperative: `import { useEffect } from 'react'
import { runOnRenderThread, useFilamentContext } from 'react-native-filament'

function Marker() {
  const { engine, scene } = useFilamentContext()

  useEffect(() => {
    const adding = runOnRenderThread(engine, () => {
      'worklet'
      const box = engine.createDebugBox({ halfExtent: [0.5, 0.5, 0.5], color: [1, 0, 0, 1] })
      scene.addEntity(box.entity)
      return box
    })
    return () => {
      adding.then((box) =>
        runOnRenderThread(engine, () => {
          'worklet'
          scene.removeEntity(box.entity)
        }).then(() => box.dispose())
      )
    }
  }, [engine, scene])

  return null
}`,
  },

  'hooks/useFilamentContext': {
    declarative: `import { Button } from 'react-native'
import { Camera, FilamentScene, FilamentView, useFilamentContext } from 'react-native-filament'

function SnapshotButton() {
  const { target } = useFilamentContext()
  const save = async () => {
    const snapshot = await target!.takeSnapshot()
    console.log('Saved to', await snapshot.saveToTemporaryFile())
  }
  return <Button title="Save snapshot" disabled={target == null} onPress={save} />
}

export function App() {
  return (
    <FilamentScene>
      <FilamentView style={{ flex: 1 }}>
        <Camera />
        <SnapshotButton />
      </FilamentView>
    </FilamentScene>
  )
}`,
    imperative: `import { useEffect, useState } from 'react'
import { Button } from 'react-native'
import { callback } from 'react-native-nitro-modules'
import { Filament, NativeFilamentView, runOnRenderThread, type FilamentView, type ViewTarget } from 'react-native-filament'

export function App() {
  const [view, setView] = useState<FilamentView>()
  const [target, setTarget] = useState<ViewTarget>()

  useEffect(() => {
    if (view == null) return
    let active = true
    const starting = Filament.createEngine({}).then(async (engine) => {
      const created = await engine.createViewTarget(view, {})
      await runOnRenderThread(engine, () => {
        'worklet'
        created.setScene(engine.createScene())
        created.setCamera(engine.createCamera())
      })
      if (active) setTarget(created)
      return engine
    })
    return () => {
      active = false
      setTarget(undefined)
      starting.then((engine) => engine.shutdown())
    }
  }, [view])

  const save = async () => {
    const snapshot = await target!.takeSnapshot()
    console.log('Saved to', await snapshot.saveToTemporaryFile())
  }

  return (
    <>
      <NativeFilamentView style={{ flex: 1 }} hybridRef={callback(setView)} />
      <Button title="Save snapshot" disabled={target == null} onPress={save} />
    </>
  )
}`,
  },

  'hooks/useFrameCallback': {
    declarative: `import { quaternionFromAxisAngle, useFilamentContext, useFrameCallback, type Entity } from 'react-native-filament'

function Spinner({ entity }: { entity: Entity }) {
  const { transformManager } = useFilamentContext()

  useFrameCallback(
    ({ elapsedSeconds }) => {
      'worklet'
      transformManager.setRotation(entity, quaternionFromAxisAngle([0, 1, 0], elapsedSeconds))
    },
    [transformManager, entity]
  )

  return null
}`,
    imperative: `import { useEffect } from 'react'
import { quaternionFromAxisAngle, runOnRenderThread, useFilamentContext, type Entity } from 'react-native-filament'

function Spinner({ entity }: { entity: Entity }) {
  const { engine, transformManager } = useFilamentContext()

  useEffect(() => {
    const subscribing = runOnRenderThread(engine, () => {
      'worklet'
      return engine.addOnFrameListener(({ elapsedSeconds }) => {
        transformManager.setRotation(entity, quaternionFromAxisAngle([0, 1, 0], elapsedSeconds))
        return true
      })
    })
    return () => {
      subscribing.then((subscription) => subscription.remove())
    }
  }, [engine, transformManager, entity])

  return null
}`,
  },

  'hooks/useIndirectLight': {
    declarative: `import { defaultIndirectLightSource, useIndirectLight } from 'react-native-filament'

function StudioLighting({ intensity }: { intensity: number }) {
  useIndirectLight(defaultIndirectLightSource, intensity)
  return null
}`,
    imperative: `import { useEffect } from 'react'
import { defaultIndirectLightSource, runOnRenderThread, useFilamentContext } from 'react-native-filament'

function StudioLighting({ intensity }: { intensity: number }) {
  const { engine, scene } = useFilamentContext()

  useEffect(() => {
    const loading = engine.loadIndirectLight(defaultIndirectLightSource, { intensity }).then(async (light) => {
      await runOnRenderThread(engine, () => {
        'worklet'
        scene.setIndirectLight(light)
      })
      return light
    })
    return () => {
      loading.then((light) => light.dispose())
    }
  }, [engine, scene, intensity])

  return null
}`,
  },

  'hooks/useLightEntity': {
    declarative: `import { useEntityInScene, useFilamentContext, useLightEntity } from 'react-native-filament'

function Spotlight({ intensity }: { intensity: number }) {
  const { scene } = useFilamentContext()
  const light = useLightEntity({
    type: 'spot',
    position: [0, 3, 0],
    direction: [0, -1, 0],
    intensity,
    falloffRadius: 8,
    castShadows: true,
  })
  useEntityInScene(scene, light?.entity)
  return null
}`,
    imperative: `import { useEffect, useState } from 'react'
import { runOnRenderThread, useFilamentContext, type Light } from 'react-native-filament'

function Spotlight({ intensity }: { intensity: number }) {
  const { engine, scene, lightManager } = useFilamentContext()
  const [light, setLight] = useState<Light>()

  useEffect(() => {
    let active = true
    const creating = runOnRenderThread(engine, () => {
      'worklet'
      const created = engine.createSpotLight({ position: [0, 3, 0], direction: [0, -1, 0], falloffRadius: 8, castShadows: true })
      scene.addEntity(created.entity)
      return created
    })
    creating.then((created) => {
      if (active) setLight(created)
    })
    return () => {
      active = false
      setLight(undefined)
      creating.then((created) => created.dispose())
    }
  }, [engine, scene])

  useEffect(() => {
    if (light == null) return
    runOnRenderThread(engine, () => {
      'worklet'
      lightManager.setIntensity(light.entity, intensity)
    })
  }, [engine, lightManager, light, intensity])

  return null
}`,
  },

  'hooks/useModel': {
    declarative: `import { useEffect } from 'react'
import { ModelRenderer, useModel } from 'react-native-filament'

function Drone() {
  const model = useModel(require('./assets/drone.glb'), { instanceCount: 1 })

  useEffect(() => {
    if (model.state === 'loaded') console.log('Bounds', model.boundingBox)
  }, [model])

  return <ModelRenderer model={model} transformToUnitCube />
}`,
    imperative: `import { useEffect, useState } from 'react'
import { Image } from 'react-native'
import { runOnRenderThread, useFilamentContext, type Model } from 'react-native-filament'

const drone = Image.resolveAssetSource(require('./assets/drone.glb'))

function useDrone() {
  const { engine, scene, transformManager } = useFilamentContext()
  const [model, setModel] = useState<Model>()

  useEffect(() => {
    let active = true
    const loading = engine.loadModel({ uri: drone.uri }, { instanceCount: 1 }).then(async (loaded) => {
      await runOnRenderThread(engine, () => {
        'worklet'
        scene.addModel(loaded)
        transformManager.transformToUnitCube(loaded.rootEntity, loaded.boundingBox)
      })
      console.log('Bounds', loaded.boundingBox)
      if (active) setModel(loaded)
      return loaded
    })
    return () => {
      active = false
      setModel(undefined)
      loading.then((loaded) => loaded.dispose())
    }
  }, [engine, scene, transformManager])

  return model
}`,
  },

  'hooks/useOrbitGestures': {
    declarative: `import { GestureDetector } from 'react-native-gesture-handler'
import { Camera, DefaultLight, FilamentScene, FilamentView, Model, useCameraManipulator, useOrbitGestures, type CameraManipulator } from 'react-native-filament'

function OrbitView({ manipulator }: { manipulator: CameraManipulator }) {
  const gesture = useOrbitGestures(manipulator, { pinchSpeed: 150 })
  return (
    <GestureDetector gesture={gesture}>
      <FilamentView style={{ flex: 1 }}>
        <Camera cameraManipulator={manipulator} />
        <DefaultLight />
        <Model source={require('./assets/helmet.glb')} transformToUnitCube />
      </FilamentView>
    </GestureDetector>
  )
}

function Orbit() {
  const manipulator = useCameraManipulator({ homePosition: [0, 0, 6] })
  return manipulator == null ? null : <OrbitView manipulator={manipulator} />
}

export const App = () => (
  <FilamentScene>
    <Orbit />
  </FilamentScene>
)`,
    imperative: `import { useMemo } from 'react'
import { Gesture } from 'react-native-gesture-handler'
import type { CameraManipulator } from 'react-native-filament'

export function useManipulatorGesture(manipulator: CameraManipulator, pinchSpeed = 150) {
  return useMemo(() => {
    const pan = Gesture.Pan()
      .maxPointers(1)
      .onBegin(({ x, y }) => {
        'worklet'
        manipulator.grabBegin(x, y, false)
      })
      .onUpdate(({ x, y }) => {
        'worklet'
        manipulator.grabUpdate(x, y)
      })
      .onFinalize(() => {
        'worklet'
        manipulator.grabEnd()
      })
    const pinch = Gesture.Pinch().onChange(({ focalX, focalY, scaleChange }) => {
      'worklet'
      manipulator.scroll(focalX, focalY, (1 - scaleChange) * pinchSpeed)
    })
    const home = Gesture.Tap()
      .numberOfTaps(2)
      .onEnd(() => {
        'worklet'
        manipulator.jumpToHome()
      })
    return Gesture.Simultaneous(pan, pinch, home)
  }, [manipulator, pinchSpeed])
}

// Attach it like the declarative version, around the view the camera follows the manipulator in:
// <GestureDetector gesture={useManipulatorGesture(manipulator)}>
//   <NativeFilamentView style={{ flex: 1 }} hybridRef={callback(setView)} />
// </GestureDetector>
// See the useCameraManipulator example for creating the manipulator and following it with a camera.`,
  },

  'hooks/useRecorder': {
    declarative: `import { Button } from 'react-native'
import { Camera, DefaultLight, FilamentScene, Model, useRecorder } from 'react-native-filament'

function Recording() {
  const recorder = useRecorder({ width: 720, height: 1280, fps: 60, bitRate: 2_000_000 })
  const record = async () => console.log('Saved to', await recorder!.record(60 * 5))
  return (
    <>
      <Camera aspect={720 / 1280} />
      <DefaultLight />
      <Model source={require('./assets/drone.glb')} transformToUnitCube />
      <Button title="Record 5 s" disabled={recorder == null} onPress={record} />
    </>
  )
}

export const App = () => (
  <FilamentScene>
    <Recording />
  </FilamentScene>
)`,
    imperative: `import { useEffect, useState } from 'react'
import { Button } from 'react-native'
import { runOnRenderThread, useFilamentContext, type Recorder } from 'react-native-filament'

function RecordButton() {
  const { engine, scene, camera } = useFilamentContext()
  const [recorder, setRecorder] = useState<Recorder>()

  useEffect(() => {
    let active = true
    const creating = runOnRenderThread(engine, () => {
      'worklet'
      const created = engine.createRecorder({ width: 720, height: 1280, fps: 60, bitRate: 2_000_000 })
      created.setScene(scene)
      created.setCamera(camera)
      camera.setLensProjection(28, created.width / created.height, 0.1, 100)
      return created
    })
    creating.then((created) => {
      if (active) setRecorder(created)
    })
    return () => {
      active = false
      setRecorder(undefined)
      creating.then((created) => created.dispose())
    }
  }, [engine, scene, camera])

  const record = async () => console.log('Saved to', await recorder!.record(60 * 5))
  return <Button title="Record 5 s" disabled={recorder == null} onPress={record} />
}`,
  },

  'hooks/useRecorderRenderLoop': {
    declarative: `import { Button } from 'react-native'
import { quaternionFromAxisAngle, useFilamentContext, useRecorder, useRecorderRenderLoop, type Entity } from 'react-native-filament'

function SpinRecording({ entity }: { entity: Entity }) {
  const { transformManager } = useFilamentContext()
  const recorder = useRecorder({ width: 1080, height: 1080, fps: 30 })

  useRecorderRenderLoop(
    recorder,
    ({ elapsedSeconds }) => {
      'worklet'
      transformManager.setRotation(entity, quaternionFromAxisAngle([0, 1, 0], elapsedSeconds * Math.PI))
    },
    [transformManager, entity]
  )

  return <Button title="Record 2 s" disabled={recorder == null} onPress={() => recorder?.record(60).then(console.log)} />
}`,
    imperative: `import { useEffect } from 'react'
import { Button } from 'react-native'
import { quaternionFromAxisAngle, runOnRenderThread, useFilamentContext, type Entity, type Recorder } from 'react-native-filament'

function SpinRecording({ recorder, entity }: { recorder: Recorder; entity: Entity }) {
  const { engine, transformManager } = useFilamentContext()

  useEffect(() => {
    const subscribing = runOnRenderThread(engine, () => {
      'worklet'
      return engine.addOnFrameListener(({ elapsedSeconds }) => {
        transformManager.setRotation(entity, quaternionFromAxisAngle([0, 1, 0], elapsedSeconds * Math.PI))
        return true
      })
    })
    return () => {
      subscribing.then((subscription) => subscription.remove())
    }
  }, [engine, transformManager, entity])

  return <Button title="Record 2 s" onPress={() => recorder.record(60).then(console.log)} />
}`,
  },

  'hooks/useRenderThreadCallback': {
    declarative: `import { Button } from 'react-native'
import { useFilamentContext, useRenderThreadCallback, type Entity } from 'react-native-filament'

function GrowButton({ entity }: { entity: Entity }) {
  const { transformManager } = useFilamentContext()
  const setScale = useRenderThreadCallback(
    (factor: number) => {
      'worklet'
      transformManager.setScale(entity, [factor, factor, factor])
      return transformManager.getWorldTransform(entity)
    },
    [transformManager, entity]
  )
  return <Button title="Grow" onPress={() => setScale(2).then((matrix) => console.log(matrix))} />
}`,
    imperative: `import { Button } from 'react-native'
import { runOnRenderThread, useFilamentContext, type Entity } from 'react-native-filament'

function GrowButton({ entity }: { entity: Entity }) {
  const { engine, transformManager } = useFilamentContext()
  const setScale = (factor: number) =>
    runOnRenderThread(engine, () => {
      'worklet'
      transformManager.setScale(entity, [factor, factor, factor])
      return transformManager.getWorldTransform(entity)
    })
  return <Button title="Grow" onPress={() => setScale(2).then((matrix) => console.log(matrix))} />
}`,
  },

  'hooks/useRenderThreadEffect': {
    declarative: `import { useFilamentContext, useRenderThreadEffect, type Entity, type Float4 } from 'react-native-filament'

function Tint({ entity, color }: { entity: Entity; color: Float4 }) {
  const { renderableManager } = useFilamentContext()

  useRenderThreadEffect(() => {
    'worklet'
    const material = renderableManager.getMaterialInstanceAt(entity, 0)
    const original = material.getFloat4Parameter('baseColorFactor')
    material.setFloat4Parameter('baseColorFactor', color)
    return () => material.setFloat4Parameter('baseColorFactor', original)
  }, [renderableManager, entity, color])

  return null
}`,
    imperative: `import { useEffect, useRef } from 'react'
import { runOnRenderThread, useFilamentContext, type Entity, type Float4 } from 'react-native-filament'

function Tint({ entity, color }: { entity: Entity; color: Float4 }) {
  const { engine, renderableManager } = useFilamentContext()
  // Each run waits for the previous restore, as useRenderThreadEffect orders cleanups before the next run.
  const restored = useRef<Promise<unknown>>(Promise.resolve())

  useEffect(() => {
    const applying = restored.current.then(() =>
      runOnRenderThread(engine, () => {
        'worklet'
        const material = renderableManager.getMaterialInstanceAt(entity, 0)
        const original = material.getFloat4Parameter('baseColorFactor')
        material.setFloat4Parameter('baseColorFactor', color)
        return original
      })
    )
    return () => {
      restored.current = applying.then((original) =>
        runOnRenderThread(engine, () => {
          'worklet'
          renderableManager.getMaterialInstanceAt(entity, 0).setFloat4Parameter('baseColorFactor', original)
        })
      )
    }
  }, [engine, renderableManager, entity, color])

  return null
}`,
  },

  'hooks/useRenderThreadMemo': {
    declarative: `import { Text } from 'react-native'
import { useRenderThreadMemo, type Model } from 'react-native-filament'

function NodeNames({ model }: { model: Model }) {
  const names = useRenderThreadMemo(() => {
    'worklet'
    return model.entities.flatMap((entity) => model.getEntityName(entity) ?? [])
  }, [model])

  return <Text>{names == null ? 'Loading…' : names.join(', ')}</Text>
}`,
    imperative: `import { useEffect, useState } from 'react'
import { Text } from 'react-native'
import { runOnRenderThread, useFilamentContext, type Model } from 'react-native-filament'

function NodeNames({ model }: { model: Model }) {
  const { engine } = useFilamentContext()
  const [names, setNames] = useState<string[]>()

  useEffect(() => {
    let current = true
    runOnRenderThread(engine, () => {
      'worklet'
      return model.entities.flatMap((entity) => model.getEntityName(entity) ?? [])
    }).then((result) => {
      if (current) setNames(result)
    })
    return () => {
      current = false
    }
  }, [engine, model])

  return <Text>{names == null ? 'Loading…' : names.join(', ')}</Text>
}`,
  },

  'hooks/useRigidBody': {
    declarative: `import { Button } from 'react-native'
import { useFilamentContext, useRenderThreadCallback, useRigidBody, useSphereShape, type Entity, type PhysicsWorld } from 'react-native-filament'

function Ball({ world, entity }: { world: PhysicsWorld | undefined; entity: Entity }) {
  const { engine } = useFilamentContext()
  const shape = useSphereShape(world, 0.25)
  const body = useRigidBody(world, shape == null ? undefined : { shape, mass: 1, position: [0, 3, 0], restitution: 0.6, id: 'ball', entity })
  const kick = useRenderThreadCallback(() => {
    'worklet'
    body?.applyCentralImpulse([0, 4, 0])
    // Changing a body does not request a frame in on-demand mode.
    engine.requestFrame()
  }, [body, engine])
  return <Button title="Kick" disabled={body == null} onPress={() => kick()} />
}`,
    imperative: `import { useEffect, useState } from 'react'
import { Button } from 'react-native'
import { runOnRenderThread, useFilamentContext, type Entity, type PhysicsWorld, type RigidBody } from 'react-native-filament'

function Ball({ world, entity }: { world: PhysicsWorld; entity: Entity }) {
  const { engine } = useFilamentContext()
  const [body, setBody] = useState<RigidBody>()

  useEffect(() => {
    let active = true
    const creating = runOnRenderThread(engine, () => {
      'worklet'
      const shape = world.createSphereShape(0.25)
      return world.createRigidBody({ shape, mass: 1, position: [0, 3, 0], restitution: 0.6, id: 'ball', entity })
    })
    creating.then((created) => {
      if (active) setBody(created)
    })
    return () => {
      active = false
      setBody(undefined)
      creating.then((created) => created.dispose())
    }
  }, [engine, world, entity])

  const kick = () =>
    runOnRenderThread(engine, () => {
      'worklet'
      body?.applyCentralImpulse([0, 4, 0])
      // Changing a body does not request a frame in on-demand mode.
      engine.requestFrame()
    })
  return <Button title="Kick" disabled={body == null} onPress={kick} />
}`,
  },

  'hooks/useSkybox': {
    declarative: `import { useSkybox } from 'react-native-filament'

function Sky({ night }: { night: boolean }) {
  useSkybox({ color: night ? [0.01, 0.01, 0.03, 1] : [0.35, 0.6, 0.9, 1] })
  return null
}`,
    imperative: `import { useEffect } from 'react'
import { runOnRenderThread, useFilamentContext } from 'react-native-filament'

function Sky({ night }: { night: boolean }) {
  const { engine, scene } = useFilamentContext()

  useEffect(() => {
    const creating = runOnRenderThread(engine, () => {
      'worklet'
      const skybox = engine.createSkybox(night ? [0.01, 0.01, 0.03, 1] : [0.35, 0.6, 0.9, 1])
      scene.setSkybox(skybox)
      return skybox
    })
    return () => {
      creating.then((skybox) => skybox.dispose())
    }
  }, [engine, scene, night])

  return null
}`,
  },

  'hooks/useSphereShape': {
    declarative: `import { useRigidBody, useSphereShape, type Entity, type PhysicsWorld } from 'react-native-filament'

function Marble({ world, entity }: { world: PhysicsWorld | undefined; entity: Entity }) {
  const shape = useSphereShape(world, 0.1)
  useRigidBody(world, shape == null ? undefined : { shape, mass: 0.05, position: [0, 2, 0], restitution: 0.8, entity })
  return null
}`,
    imperative: `import { useEffect } from 'react'
import { runOnRenderThread, useFilamentContext, type Entity, type PhysicsWorld } from 'react-native-filament'

function Marble({ world, entity }: { world: PhysicsWorld; entity: Entity }) {
  const { engine } = useFilamentContext()

  useEffect(() => {
    const creating = runOnRenderThread(engine, () => {
      'worklet'
      const shape = world.createSphereShape(0.1)
      return world.createRigidBody({ shape, mass: 0.05, position: [0, 2, 0], restitution: 0.8, entity })
    })
    return () => {
      creating.then((body) => body.dispose())
    }
  }, [engine, world, entity])

  return null
}`,
  },

  'hooks/useStaticPlaneShape': {
    declarative: `import { useRigidBody, useStaticPlaneShape, type PhysicsWorld } from 'react-native-filament'

function Floor({ world }: { world: PhysicsWorld | undefined }) {
  const shape = useStaticPlaneShape(world, [0, 1, 0], -1.5)
  useRigidBody(world, shape == null ? undefined : { shape, mass: 0, friction: 1, id: 'floor' })
  return null
}`,
    imperative: `import { useEffect } from 'react'
import { runOnRenderThread, useFilamentContext, type PhysicsWorld } from 'react-native-filament'

function Floor({ world }: { world: PhysicsWorld }) {
  const { engine } = useFilamentContext()

  useEffect(() => {
    const creating = runOnRenderThread(engine, () => {
      'worklet'
      const shape = world.createStaticPlaneShape([0, 1, 0], -1.5)
      return world.createRigidBody({ shape, mass: 0, friction: 1, id: 'floor' })
    })
    return () => {
      creating.then((body) => body.dispose())
    }
  }, [engine, world])

  return null
}`,
  },

  'hooks/useTransformBinding': {
    declarative: `import { useEffect } from 'react'
import { useSharedValue, withRepeat, withTiming } from 'react-native-reanimated'
import { bindSharedValue, quaternionFromAxisAngle, useTransformBinding, type Entity } from 'react-native-filament'

function Spin({ entity }: { entity: Entity }) {
  const angle = useSharedValue(0)
  const binding = useTransformBinding(entity)

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

  return null
}`,
    imperative: `import { useEffect } from 'react'
import { useSharedValue, withRepeat, withTiming } from 'react-native-reanimated'
import { bindSharedValue, quaternionFromAxisAngle, runOnRenderThread, useFilamentContext, type Entity } from 'react-native-filament'

function Spin({ entity }: { entity: Entity }) {
  const { engine } = useFilamentContext()
  const angle = useSharedValue(0)

  useEffect(() => {
    angle.value = withRepeat(withTiming(2 * Math.PI, { duration: 4000 }), -1)
  }, [angle])

  useEffect(() => {
    const creating = runOnRenderThread(engine, () => {
      'worklet'
      return engine.createTransformBinding(entity)
    })
    const unbinding = creating.then((binding) =>
      bindSharedValue(angle, (radians) => {
        'worklet'
        const [x, y, z, w] = quaternionFromAxisAngle([0, 1, 0], radians)
        binding.setRotation(x, y, z, w)
      })
    )
    return () => {
      unbinding.then((unbind) => unbind())
      creating.then((binding) => binding.dispose())
    }
  }, [engine, entity, angle])

  return null
}`,
  },

  'hooks/useValueBinding': {
    declarative: `import type { SharedValue } from 'react-native-reanimated'
import { useFilamentContext, useRenderThreadEffect, useValueBinding, type Entity } from 'react-native-filament'

function AnimatedSun({ sun, lux }: { sun: Entity; lux: SharedValue<number> }) {
  const { engine, lightManager } = useFilamentContext()
  const intensity = useValueBinding(lux)

  useRenderThreadEffect(() => {
    'worklet'
    if (intensity == null) return
    const subscription = engine.addOnFrameListener(() => {
      lightManager.setIntensity(sun, intensity.value)
      return false
    })
    return () => subscription.remove()
  }, [engine, lightManager, sun, intensity])

  return null
}`,
    imperative: `import { useEffect } from 'react'
import type { SharedValue } from 'react-native-reanimated'
import { bindSharedValue, runOnRenderThread, useFilamentContext, type Entity } from 'react-native-filament'

function AnimatedSun({ sun, lux }: { sun: Entity; lux: SharedValue<number> }) {
  const { engine, lightManager } = useFilamentContext()

  useEffect(() => {
    const intensity = engine.createValueBinding(lux.value)
    const unbind = bindSharedValue(lux, (value) => {
      'worklet'
      intensity.set(value)
    })
    const subscribing = runOnRenderThread(engine, () => {
      'worklet'
      return engine.addOnFrameListener(() => {
        lightManager.setIntensity(sun, intensity.value)
        return false
      })
    })
    return () => {
      unbind()
      subscribing.then((subscription) => subscription.remove()).then(() => intensity.dispose())
    }
  }, [engine, lightManager, sun, lux])

  return null
}`,
  },

  'hooks/useWorkletCallback': {
    declarative: `import { Button } from 'react-native'
import { useFilamentContext, useWorkletCallback, type Entity } from 'react-native-filament'

function PositionButton({ entity }: { entity: Entity }) {
  const { transformManager } = useFilamentContext()
  const readTransform = useWorkletCallback(() => {
    'worklet'
    return transformManager.getWorldTransform(entity)
  })
  const log = async () => {
    const matrix = await readTransform()
    console.log('Position', matrix[12], matrix[13], matrix[14])
  }
  return <Button title="Log position" onPress={log} />
}`,
    imperative: `import { Button } from 'react-native'
import { runOnRenderThread, useFilamentContext, type Entity } from 'react-native-filament'

function PositionButton({ entity }: { entity: Entity }) {
  const { engine, transformManager } = useFilamentContext()
  const log = async () => {
    const matrix = await runOnRenderThread(engine, () => {
      'worklet'
      return transformManager.getWorldTransform(entity)
    })
    console.log('Position', matrix[12], matrix[13], matrix[14])
  }
  return <Button title="Log position" onPress={log} />
}`,
  },

  'hooks/useWorkletEffect': {
    declarative: `import { useFilamentContext, useWorkletEffect, type Entity } from 'react-native-filament'

function Scaled({ entity, size }: { entity: Entity; size: number }) {
  const { transformManager } = useFilamentContext()

  useWorkletEffect(() => {
    'worklet'
    transformManager.setScale(entity, [size, size, size])
    return () => transformManager.setScale(entity, [1, 1, 1])
  })

  return null
}`,
    imperative: `import { useEffect } from 'react'
import { runOnRenderThread, useFilamentContext, type Entity } from 'react-native-filament'

function Scaled({ entity, size }: { entity: Entity; size: number }) {
  const { engine, transformManager } = useFilamentContext()

  useEffect(() => {
    runOnRenderThread(engine, () => {
      'worklet'
      transformManager.setScale(entity, [size, size, size])
    })
    return () => {
      runOnRenderThread(engine, () => {
        'worklet'
        transformManager.setScale(entity, [1, 1, 1])
      })
    }
  }, [engine, transformManager, entity, size])

  return null
}`,
  },

  'hooks/useWorkletMemo': {
    declarative: `import { Text } from 'react-native'
import { useWorkletMemo, type Entity, type Model } from 'react-native-filament'

function MorphTargets({ model, entity }: { model: Model; entity: Entity }) {
  const names = useWorkletMemo(() => {
    'worklet'
    return model.getMorphTargetNames(entity)
  }, [model, entity])

  return <Text>{names == null ? 'Loading…' : names.join(', ')}</Text>
}`,
    imperative: `import { useEffect, useState } from 'react'
import { Text } from 'react-native'
import { runOnRenderThread, useFilamentContext, type Entity, type Model } from 'react-native-filament'

function MorphTargets({ model, entity }: { model: Model; entity: Entity }) {
  const { engine } = useFilamentContext()
  const [names, setNames] = useState<string[]>()

  useEffect(() => {
    let current = true
    runOnRenderThread(engine, () => {
      'worklet'
      return model.getMorphTargetNames(entity)
    }).then((result) => {
      if (current) setNames(result)
    })
    return () => {
      current = false
    }
  }, [engine, model, entity])

  return <Text>{names == null ? 'Loading…' : names.join(', ')}</Text>
}`,
  },

  'hooks/useWorld': {
    declarative: `import { useRigidBody, useSphereShape, useStaticPlaneShape, useWorld, type Entity } from 'react-native-filament'

function Physics({ ball }: { ball: Entity }) {
  const world = useWorld({ gravity: [0, -9.81, 0], fixedTimeStepSeconds: 1 / 120 })
  const floorShape = useStaticPlaneShape(world, [0, 1, 0], 0)
  const ballShape = useSphereShape(world, 0.25)
  useRigidBody(world, floorShape == null ? undefined : { shape: floorShape, mass: 0 })
  useRigidBody(world, ballShape == null ? undefined : { shape: ballShape, mass: 1, position: [0, 3, 0], restitution: 0.6, entity: ball })
  return null
}`,
    imperative: `import { useEffect } from 'react'
import { runOnRenderThread, useFilamentContext, type Entity } from 'react-native-filament'

function Physics({ ball }: { ball: Entity }) {
  const { engine } = useFilamentContext()

  useEffect(() => {
    const creating = runOnRenderThread(engine, () => {
      'worklet'
      const world = engine.createPhysicsWorld({ gravity: [0, -9.81, 0], fixedTimeStepSeconds: 1 / 120 })
      world.createRigidBody({ shape: world.createStaticPlaneShape([0, 1, 0], 0), mass: 0 })
      world.createRigidBody({ shape: world.createSphereShape(0.25), mass: 1, position: [0, 3, 0], restitution: 0.6, entity: ball })
      return world
    })
    return () => {
      creating.then((world) => world.dispose())
    }
  }, [engine, ball])

  return null
}`,
  },
}
