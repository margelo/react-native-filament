import React, { useEffect, useState } from 'react'
import { Image, StyleSheet } from 'react-native'
import { callback } from 'react-native-nitro-modules'
import { Filament, NativeFilamentView, runOnRenderThread, type FilamentView } from 'react-native-filament'

const drone = Image.resolveAssetSource(require('../../assets/buster_drone.glb'))
const skyboxFile = Image.resolveAssetSource(require('../../assets/default_env_skybox.ktx'))

export function SkyboxExample() {
  const [view, setView] = useState<FilamentView>()

  useEffect(() => {
    if (view == null) return
    const starting = Filament.createEngine({}).then(async (engine) => {
      const [target, model, skybox] = await Promise.all([
        engine.createViewTarget(view, {}),
        engine.loadModel({ uri: drone.uri }, {}),
        engine.loadSkybox({ uri: skyboxFile.uri }),
      ])
      const camera = await runOnRenderThread(engine, () => {
        'worklet'
        const scene = engine.createScene()
        scene.setSkybox(skybox)
        scene.addEntity(engine.createDirectionalLight({ direction: [0.3, -1, -0.6], intensityLux: 100000, colorKelvin: 6500 }).entity)
        scene.addModel(model)
        engine.transformManager.transformToUnitCube(model.rootEntity, model.boundingBox)
        const lens = engine.createCamera()
        lens.lookAt([0, 0, 4], [0, 0, 0], [0, 1, 0])
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
      return { engine, resize }
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
