import React, { useEffect, useState } from 'react'
import { Button, Image, StyleSheet, View } from 'react-native'
import { useSharedValue, withSpring } from 'react-native-reanimated'
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

const coin = Image.resolveAssetSource(require('../../assets/coin.glb'))

export function ScaleEffectExample() {
  const [view, setView] = useState<FilamentView>()
  const scale = useSharedValue(0)

  useEffect(() => {
    if (view == null) return
    const starting = Filament.createEngine({}).then(async (engine) => {
      const [target, model, environment] = await Promise.all([
        engine.createViewTarget(view, {}),
        engine.loadModel({ uri: coin.uri }, {}),
        engine.loadIndirectLight(defaultIndirectLightSource, {}),
      ])
      const { camera, binding, unitScale } = await runOnRenderThread(engine, () => {
        'worklet'
        const scene = engine.createScene()
        scene.setIndirectLight(environment)
        scene.addEntity(engine.createDirectionalLight({ direction: [0.3, -1, -0.6] }).entity)
        scene.addModel(model)
        const tm = engine.transformManager
        tm.transformToUnitCube(model.rootEntity, model.boundingBox)
        const fitted = tm.getTransform(model.rootEntity)
        const created = engine.createTransformBinding(model.rootEntity)
        const [x, y, z, w] = quaternionFromAxisAngle([1, 0, 0], (75 * Math.PI) / 180)
        created.setRotation(x, y, z, w)
        created.setScale(0, 0, 0)
        const lens = engine.createCamera()
        lens.lookAt([0, 0, 8], [0, 0, 0], [0, 1, 0])
        target.setScene(scene)
        target.setCamera(lens)
        return { camera: lens, binding: created, unitScale: fitted[0] }
      })
      const resize = target.addOnResizeListener((width, height) => {
        runOnRenderThread(engine, () => {
          'worklet'
          camera.setLensProjection(35, width / height, 0.1, 100)
        })
      })
      const unbind = bindSharedValue(scale, (value) => {
        'worklet'
        binding.setScale(value * unitScale, value * unitScale, value * unitScale)
      })
      return { engine, resize, unbind, binding }
    })
    return () => {
      starting.then(({ engine, resize, unbind }) => {
        unbind()
        resize.remove()
        engine.shutdown()
      })
    }
  }, [view, scale])

  const grow = () => {
    scale.value = 0
    scale.value = withSpring(1, { mass: 3, stiffness: 1000, damping: 500 })
  }

  return (
    <View style={styles.background}>
      <NativeFilamentView style={styles.container} transparent hybridRef={callback(setView)} />
      <Button title="Scale" onPress={grow} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { flex: 1, backgroundColor: 'lightblue' },
})
