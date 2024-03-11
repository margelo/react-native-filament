import * as React from 'react'
import { useEffect, useMemo, useRef } from 'react'

import { Platform, StyleSheet } from 'react-native'
import { Filament, useEngine, Float3, useRenderCallback, useAsset } from 'react-native-filament'

const penguModelPath = Platform.select({
  android: 'custom/pengu.glb',
  ios: 'pengu.glb',
})!

const indirectLightPath = Platform.select({
  android: 'custom/default_env_ibl.ktx',
  ios: 'default_env_ibl.ktx',
})!

// Camera config:
const cameraPosition: Float3 = [0, 0, 8]
const cameraTarget: Float3 = [0, 0, 0]
const cameraUp: Float3 = [0, 1, 0]
const focalLengthInMillimeters = 28
const near = 0.1
const far = 1000

export default function App() {
  const engine = useEngine()

  const pengu = useAsset({ path: penguModelPath })
  const light = useAsset({ path: indirectLightPath })

  const penguAnimator = useMemo(() => {
    if (pengu == null) return undefined

    const asset = engine.loadAsset(pengu)
    const animator = asset.getAnimator()
    asset.releaseSourceData()
    return animator
  }, [engine, pengu])

  useEffect(() => {
    if (light == null) return
    // create a default light
    engine.setIndirectLight(light)

    // Create a directional light for supporting shadows
    const directionalLight = engine.createLightEntity('directional', 6500, 10000, 0, -1, 0, true)
    engine.getScene().addEntity(directionalLight)
    return () => {
      // TODO: Remove directionalLight from scene
    }
  }, [engine, light])

  const prevAspectRatio = useRef(0)
  useRenderCallback(engine, (_timestamp, _startTime, passedSeconds) => {
    const view = engine.getView()
    const aspectRatio = view.aspectRatio
    if (prevAspectRatio.current !== aspectRatio) {
      prevAspectRatio.current = aspectRatio
      // Setup camera lens:
      const camera = engine.getCamera()
      camera.setLensProjection(focalLengthInMillimeters, aspectRatio, near, far)
    }

    if (penguAnimator != null) {
      penguAnimator.applyAnimation(0, passedSeconds)
      penguAnimator.updateBoneMatrices()
    }

    engine.getCamera().lookAt(cameraPosition, cameraTarget, cameraUp)
  })

  return <Filament style={styles.filamentView} engine={engine} />
}

const styles = StyleSheet.create({
  filamentView: {
    flex: 1,
    backgroundColor: 'lightblue',
  },
})
