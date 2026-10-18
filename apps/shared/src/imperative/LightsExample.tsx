import React, { useEffect, useState } from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'
import { callback } from 'react-native-nitro-modules'
import { defaultIndirectLightSource, Filament, NativeFilamentView, runOnRenderThread, type FilamentView } from 'react-native-filament'

const drone = Image.resolveAssetSource(require('../../assets/buster_drone.glb'))

export function LightsExample() {
  const [view, setView] = useState<FilamentView>()
  const [rendered, setRendered] = useState(false)

  useEffect(() => {
    if (view == null) return
    const starting = Filament.createEngine({}).then(async (engine) => {
      const [target, model, environment] = await Promise.all([
        engine.createViewTarget(view, {}),
        engine.loadModel({ uri: drone.uri }, {}),
        engine.loadIndirectLight(defaultIndirectLightSource, { intensity: 2500 }),
      ])
      const firstFrame = target.addOnFirstFrameListener(() => setRendered(true))
      const { camera, lights } = await runOnRenderThread(engine, () => {
        'worklet'
        const scene = engine.createScene()
        const sun = engine.createSunLight({ direction: [0.4, -1, -0.5], intensityLux: 12000 })
        const red = engine.createPointLight({ colorKelvin: 1500, intensityLumens: 600000, falloffRadius: 4 })
        const blue = engine.createFocusedSpotLight({
          colorKelvin: 12000,
          intensityLumens: 800000,
          position: [0, 2, 0.5],
          direction: [0, -1, -0.2],
          falloffRadius: 5,
          outerConeRadians: 0.5,
        })
        scene.setIndirectLight(environment)
        for (const light of [sun, red, blue]) scene.addEntity(light.entity)
        scene.addModel(model)
        engine.transformManager.transformToUnitCube(model.rootEntity, model.boundingBox)
        target.view.setBloomOptions({ enabled: true, strength: 0.15 })
        target.view.setAmbientOcclusionOptions({ enabled: true })
        const lens = engine.createCamera()
        lens.lookAt([0, 0.7, 3.4], [0, 0, 0], [0, 1, 0])
        target.setScene(scene)
        target.setCamera(lens)
        engine.addOnFrameListener((frame) => {
          const angle = frame.elapsedSeconds * 1.5
          engine.lightManager.setPosition(red.entity, [Math.cos(angle) * 1.4, 0.3, Math.sin(angle) * 1.4])
          return true
        })
        return { camera: lens, lights: [sun, red, blue] }
      })
      const resize = target.addOnResizeListener((width, height) => {
        runOnRenderThread(engine, () => {
          'worklet'
          camera.setLensProjection(28, width / height, 0.1, 100)
        })
      })
      return { engine, lights, firstFrame, resize }
    })
    return () => {
      starting.then(({ engine, firstFrame, resize }) => {
        firstFrame.remove()
        resize.remove()
        engine.shutdown()
      })
    }
  }, [view])

  return (
    <View style={styles.container}>
      <NativeFilamentView style={styles.container} hybridRef={callback(setView)} />
      {!rendered && <Text style={styles.loading}>Loading…</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loading: { position: 'absolute', alignSelf: 'center', top: '50%', color: 'white' },
})
