import React, { useEffect, useState } from 'react'
import { Image, StyleSheet } from 'react-native'
import { callback } from 'react-native-nitro-modules'
import { defaultIndirectLightSource, Filament, NativeFilamentView, runOnRenderThread, type FilamentView } from 'react-native-filament'

const drone = Image.resolveAssetSource(require('../assets/buster_drone.glb'))

export function ModelExample() {
  const [view, setView] = useState<FilamentView>()

  useEffect(() => {
    if (view == null) return
    const starting = Filament.createEngine({}).then(async (engine) => {
      const [target, model, environment] = await Promise.all([
        engine.createViewTarget(view, {}),
        engine.loadModel({ uri: drone.uri }, {}),
        engine.loadIndirectLight(defaultIndirectLightSource, {}),
      ])
      const { center, halfExtent } = model.boundingBox
      const radius = Math.hypot(...halfExtent)
      const { camera, sun } = await runOnRenderThread(engine, () => {
        'worklet'
        const scene = engine.createScene()
        const light = engine.createDirectionalLight({ direction: [0.3, -1, -0.6] })
        scene.setIndirectLight(environment)
        scene.addEntity(light.entity)
        scene.addModel(model)
        const lens = engine.createCamera()
        lens.lookAt([center[0], center[1] + radius * 0.4, center[2] + radius * 2.6], center, [0, 1, 0])
        target.setScene(scene)
        target.setCamera(lens)
        return { camera: lens, sun: light }
      })
      const resize = target.addOnResizeListener((width, height) => {
        runOnRenderThread(engine, () => {
          'worklet'
          camera.setLensProjection(28, width / height, radius * 0.05, radius * 10)
        })
      })
      const player = model.getInstance(0).animator.createPlayer()
      player.play(0, {})
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
