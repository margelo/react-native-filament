import React, { useEffect, useState } from 'react'
import { Image, StyleSheet } from 'react-native'
import { callback } from 'react-native-nitro-modules'
import {
  defaultIndirectLightSource,
  Filament,
  NativeFilamentView,
  quaternionFromAxisAngle,
  runOnRenderThread,
  type FilamentView,
} from 'react-native-filament'

const drone = Image.resolveAssetSource(require('../assets/buster_drone.glb'))
const RADIANS_PER_SECOND = 0.6

/**
 * v1 kept the angle in a worklets-core shared value. Here it lives in a ValueBinding that the
 * render thread advances by each frame's delta and applies to the model instance.
 */
export function AnimatedRotateStateExample() {
  const [view, setView] = useState<FilamentView>()

  useEffect(() => {
    if (view == null) return
    const starting = Filament.createEngine({}).then(async (engine) => {
      const [target, model, environment] = await Promise.all([
        engine.createViewTarget(view, {}),
        engine.loadModel({ uri: drone.uri }, {}),
        engine.loadIndirectLight(defaultIndirectLightSource, {}),
      ])
      const angle = engine.createValueBinding(0)
      const camera = await runOnRenderThread(engine, () => {
        'worklet'
        const scene = engine.createScene()
        scene.setIndirectLight(environment)
        scene.setSkybox(engine.createSkybox([0.25, 0.73, 0.96, 1]))
        scene.addEntity(engine.createDirectionalLight({ direction: [0.3, -1, -0.6] }).entity)
        scene.addModel(model)
        const tm = engine.transformManager
        const instance = model.getInstance(0)
        tm.transformToUnitCube(instance.rootEntity, model.boundingBox)
        const fitted = tm.getTransform(instance.rootEntity)
        tm.setScale(instance.rootEntity, [fitted[0] * 1.5, fitted[5] * 1.5, fitted[10] * 1.5])
        tm.setTranslation(instance.rootEntity, [fitted[12] * 1.5, fitted[13] * 1.5, fitted[14] * 1.5])
        engine.addOnFrameListener((frame) => {
          angle.set((angle.value + frame.deltaSeconds * RADIANS_PER_SECOND) % (Math.PI * 2))
          tm.setRotation(instance.rootEntity, quaternionFromAxisAngle([0, 1, 0], angle.value))
          return true
        })
        const lens = engine.createCamera()
        lens.lookAt([0, 0, 8], [0, 0, 0], [0, 1, 0])
        target.setScene(scene)
        target.setCamera(lens)
        return lens
      })
      const resize = target.addOnResizeListener((width, height) => {
        runOnRenderThread(engine, () => {
          'worklet'
          camera.setLensProjection(28, width / height, 0.1, 100)
        })
      })
      return { engine, resize, angle }
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
