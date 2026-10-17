import React, { useEffect, useState } from 'react'
import { Image, StyleSheet } from 'react-native'
import { callback } from 'react-native-nitro-modules'
import { defaultIndirectLightSource, Filament, NativeFilamentView, runOnRenderThread, type FilamentView } from 'react-native-filament'

const dancer = Image.resolveAssetSource(require('../assets/hiphopgirl.glb'))

export function InstancesExample() {
  const [view, setView] = useState<FilamentView>()

  useEffect(() => {
    if (view == null) return
    const starting = Filament.createEngine({}).then(async (engine) => {
      const [target, model, environment] = await Promise.all([
        engine.createViewTarget(view, {}),
        engine.loadModel({ uri: dancer.uri }, { instanceCount: 2 }),
        engine.loadIndirectLight(defaultIndirectLightSource, {}),
      ])
      const { camera, sun } = await runOnRenderThread(engine, () => {
        'worklet'
        const scene = engine.createScene()
        const light = engine.createDirectionalLight({ direction: [0.3, -1, -0.5] })
        scene.setIndirectLight(environment)
        scene.addEntity(light.entity)
        scene.addModel(model)
        const third = model.createInstance()
        const instances = [model.getInstance(0), model.getInstance(1), third]
        instances.forEach((instance, index) => {
          engine.transformManager.setTranslation(instance.rootEntity, [(index - 1) * 0.6, 0, -0.4 * Math.abs(index - 1)])
          if (index > 0) instance.followSkeleton(instances[0]!)
        })
        const lens = engine.createCamera()
        lens.lookAt([0, 1.1, 6], [0, 0.85, 0], [0, 1, 0])
        target.setScene(scene)
        target.setCamera(lens)
        return { camera: lens, sun: light }
      })
      const player = model.getInstance(0).animator.createPlayer()
      player.play(1, {})
      const resize = target.addOnResizeListener((width, height) => {
        runOnRenderThread(engine, () => {
          'worklet'
          camera.setLensProjection(35, width / height, 0.1, 50)
        })
      })
      return { engine, resources: [sun, player], resize }
    })
    return () => {
      starting.then(({ engine, resize }) => {
        resize.remove()
        engine.shutdown()
      })
    }
  }, [view])

  return <NativeFilamentView style={styles.container} hybridRef={callback(setView)} />
}

const styles = StyleSheet.create({
  container: { flex: 1 },
})
