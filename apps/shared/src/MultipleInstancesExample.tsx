import React, { useEffect, useState } from 'react'
import { Image, StyleSheet, View } from 'react-native'
import { callback } from 'react-native-nitro-modules'
import { defaultIndirectLightSource, Filament, NativeFilamentView, runOnRenderThread, type FilamentView } from 'react-native-filament'

const drone = Image.resolveAssetSource(require('../assets/buster_drone.glb'))
const INSTANCES = 4
const SPACING = 1.2

export function MultipleInstancesExample() {
  const [view, setView] = useState<FilamentView>()

  useEffect(() => {
    if (view == null) return
    const starting = Filament.createEngine({}).then(async (engine) => {
      const [target, model, environment] = await Promise.all([
        engine.createViewTarget(view, {}),
        engine.loadModel({ uri: drone.uri }, { instanceCount: INSTANCES }),
        engine.loadIndirectLight(defaultIndirectLightSource, {}),
      ])
      const camera = await runOnRenderThread(engine, () => {
        'worklet'
        const scene = engine.createScene()
        scene.setIndirectLight(environment)
        scene.addEntity(engine.createDirectionalLight({ direction: [0.3, -1, -0.6] }).entity)
        scene.addModel(model)
        const tm = engine.transformManager
        for (let index = 0; index < INSTANCES; index++) {
          const root = model.getInstance(index).rootEntity
          tm.transformToUnitCube(root, model.boundingBox)
          const fitted = tm.getTransform(root)
          const column = (index % 2) - 0.5
          const row = Math.floor(index / 2) - 0.5
          tm.setTranslation(root, [fitted[12] + column * SPACING * 2, fitted[13] + row * SPACING * 2, fitted[14]])
        }
        const lens = engine.createCamera()
        lens.lookAt([0, 0, 12], [0, 0, 0], [0, 1, 0])
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
      const players = Array.from({ length: INSTANCES }, (_, index) => {
        const player = model.getInstance(index).animator.createPlayer()
        player.play(0, { speed: 0.6 + index * 0.25 })
        return player
      })
      return { engine, resize, players }
    })
    return () => {
      starting.then(({ engine, resize }) => {
        resize.remove()
        engine.shutdown()
      })
    }
  }, [view])

  return (
    <View style={styles.background}>
      <NativeFilamentView style={styles.container} transparent hybridRef={callback(setView)} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { flex: 1, backgroundColor: 'lightblue' },
})
