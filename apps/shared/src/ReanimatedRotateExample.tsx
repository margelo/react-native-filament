import React, { useEffect, useState } from 'react'
import { Image, StyleSheet } from 'react-native'
import { Easing, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated'
import { callback } from 'react-native-nitro-modules'
import {
  bindSharedValue,
  defaultIndirectLightSource,
  Filament,
  NativeFilamentView,
  quaternionFromAxisAngle,
  runOnRenderThread,
  type FilamentView,
} from 'react-native-filament'

const drone = Image.resolveAssetSource(require('../assets/buster_drone.glb'))

export function ReanimatedRotateExample() {
  const [view, setView] = useState<FilamentView>()
  const angle = useSharedValue(0)

  useEffect(() => {
    angle.value = withRepeat(withTiming(2 * Math.PI, { duration: 4000, easing: Easing.linear }), -1, false)
  }, [angle])

  useEffect(() => {
    if (view == null) return
    const starting = Filament.createEngine({}).then(async (engine) => {
      const [target, model, environment] = await Promise.all([
        engine.createViewTarget(view, {}),
        engine.loadModel({ uri: drone.uri }, {}),
        engine.loadIndirectLight(defaultIndirectLightSource, {}),
      ])
      const { camera, sun, spin } = await runOnRenderThread(engine, () => {
        'worklet'
        const scene = engine.createScene()
        const light = engine.createDirectionalLight({ direction: [0.3, -1, -0.6] })
        scene.setIndirectLight(environment)
        scene.addEntity(light.entity)
        scene.addModel(model)
        engine.transformManager.transformToUnitCube(model.getInstance(0).rootEntity, model.boundingBox)
        const lens = engine.createCamera()
        lens.lookAt([0, 0.6, 3.6], [0, 0, 0], [0, 1, 0])
        target.setScene(scene)
        target.setCamera(lens)
        return { camera: lens, sun: light, spin: engine.createTransformBinding(model.rootEntity) }
      })
      const resize = target.addOnResizeListener((width, height) => {
        runOnRenderThread(engine, () => {
          'worklet'
          camera.setLensProjection(28, width / height, 0.1, 100)
        })
      })
      const unbind = bindSharedValue(angle, (radians) => {
        'worklet'
        const [x, y, z, w] = quaternionFromAxisAngle([0, 1, 0], radians)
        spin.setRotation(x, y, z, w)
      })
      return { engine, resources: [sun, spin], resize, unbind }
    })
    return () => {
      starting.then(({ engine, resize, unbind }) => {
        unbind()
        resize.remove()
        engine.shutdown()
      })
    }
  }, [view, angle])

  return <NativeFilamentView style={styles.container} hybridRef={callback(setView)} />
}

const styles = StyleSheet.create({
  container: { flex: 1 },
})
