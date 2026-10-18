import React, { useEffect, useState } from 'react'
import { Button, Image, StyleSheet, View } from 'react-native'
import { useSharedValue, withTiming } from 'react-native-reanimated'
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

const coin = Image.resolveAssetSource(require('../../assets/coin_with_alpha.glb'))

/**
 * Reanimated drives the opacity on the UI runtime into a ValueBinding; a render-thread frame
 * listener writes it into every primitive's `baseColorFactor` alpha when it changes.
 */
export function FadeOutExample() {
  const [view, setView] = useState<FilamentView>()
  const opacity = useSharedValue(1)

  useEffect(() => {
    if (view == null) return
    const starting = Filament.createEngine({}).then(async (engine) => {
      const [target, model, environment] = await Promise.all([
        engine.createViewTarget(view, {}),
        engine.loadModel({ uri: coin.uri }, {}),
        engine.loadIndirectLight(defaultIndirectLightSource, {}),
      ])
      const alpha = engine.createValueBinding(1)
      const camera = await runOnRenderThread(engine, () => {
        'worklet'
        const scene = engine.createScene()
        scene.setIndirectLight(environment)
        scene.addEntity(engine.createDirectionalLight({ direction: [0.3, -1, -0.6] }).entity)
        scene.addModel(model)
        const tm = engine.transformManager
        tm.transformToUnitCube(model.rootEntity, model.boundingBox)
        tm.setRotation(model.rootEntity, quaternionFromAxisAngle([1, 0, 0], (75 * Math.PI) / 180))
        const rm = engine.renderableManager
        const instances = model.entities
          .filter((entity) => rm.hasComponent(entity))
          .flatMap((entity) => Array.from({ length: rm.getPrimitiveCount(entity) }, (_, primitive) => rm.getMaterialInstanceAt(entity, primitive)))
          .filter((instance) => instance.hasParameter('baseColorFactor'))
        const colors = instances.map((instance) => instance.getFloat4Parameter('baseColorFactor'))
        let applied = 1
        engine.addOnFrameListener(() => {
          if (alpha.value !== applied) {
            applied = alpha.value
            instances.forEach((instance, index) => {
              const [r, g, b, a] = colors[index]!
              instance.setFloat4Parameter('baseColorFactor', [r, g, b, a * applied])
            })
          }
          return false
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
          camera.setLensProjection(35, width / height, 0.1, 100)
        })
      })
      const unbind = bindSharedValue(opacity, (value) => {
        'worklet'
        alpha.set(value)
      })
      return { engine, resize, unbind }
    })
    return () => {
      starting.then(({ engine, resize, unbind }) => {
        unbind()
        resize.remove()
        engine.shutdown()
      })
    }
  }, [view, opacity])

  const fadeOut = () => {
    opacity.value = 1
    opacity.value = withTiming(0, { duration: 1000 })
  }

  return (
    <View style={styles.background}>
      <NativeFilamentView style={styles.container} transparent hybridRef={callback(setView)} />
      <Button title="Fade out" onPress={fadeOut} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { flex: 1, backgroundColor: 'lightblue' },
})
