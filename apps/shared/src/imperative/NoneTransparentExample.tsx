import React, { useEffect, useState } from 'react'
import { Image, StyleSheet } from 'react-native'
import { callback } from 'react-native-nitro-modules'
import { defaultIndirectLightSource, Filament, NativeFilamentView, runOnRenderThread, type FilamentView } from 'react-native-filament'

const drone = Image.resolveAssetSource(require('../../assets/buster_drone.glb'))

export function NoneTransparentExample() {
  const [view, setView] = useState<FilamentView>()

  useEffect(() => {
    if (view == null) return
    const starting = Filament.createEngine({}).then(async (engine) => {
      const [target, model, environment] = await Promise.all([
        engine.createViewTarget(view, {}),
        engine.loadModel({ uri: drone.uri }, {}),
        engine.loadIndirectLight(defaultIndirectLightSource, {}),
      ])
      const camera = await runOnRenderThread(engine, () => {
        'worklet'
        const scene = engine.createScene()
        scene.setIndirectLight(environment)
        scene.setSkybox(engine.createSkybox([0.25, 0.73, 0.96, 1]))
        scene.addEntity(engine.createDirectionalLight({ direction: [0.3, -1, -0.6] }).entity)
        scene.addModel(model)
        const tm = engine.transformManager
        tm.transformToUnitCube(model.rootEntity, model.boundingBox)
        const unitCube = tm.getTransform(model.rootEntity)
        tm.setScale(model.rootEntity, [unitCube[0] * 2, unitCube[5] * 2, unitCube[10] * 2])
        tm.setTranslation(model.rootEntity, [unitCube[12] * 2, unitCube[13] * 2, unitCube[14] * 2])
        const bounds = engine.createDebugBox({ halfExtent: model.boundingBox.halfExtent, center: model.boundingBox.center, color: [1, 1, 0, 1] })
        tm.setParent(bounds.entity, model.rootEntity)
        scene.addEntity(bounds.entity)
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
      const player = model.getInstance(0).animator.createPlayer()
      player.play(0, {})
      return { engine, resize, player }
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
