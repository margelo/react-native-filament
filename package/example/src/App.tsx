import * as React from 'react'
import { useCallback, useEffect, useMemo } from 'react'

import { Platform, StyleSheet, useWindowDimensions } from 'react-native'
import { FilamentProxy, FilamentView, Float3, RenderCallback } from 'react-native-filament'

const engine = FilamentProxy.createEngine()

const penguModelPath = Platform.select({
  android: 'custom/pengu.glb',
  ios: 'pengu.glb',
})!

const indirectLightPath = Platform.select({
  android: 'custom/default_env_ibl.ktx',
  ios: 'default_env_ibl.ktx',
})!

const cameraPosition: Float3 = [0, 0, 8]
const cameraTarget: Float3 = [0, 0, 0]
const cameraUp: Float3 = [0, 1, 0]

export default function App() {
  const { width, height } = useWindowDimensions()
  // As the view is flex: 1 its aspect ratio is equal to the screen's aspect ratio
  // otherwise you can use engine.getView().aspectRatio
  const viewAspectRatio = width / height
  // TODO: It would be better to rely on the engine.view's aspect ratio

  const [_pengu, penguAnimator] = useMemo(() => {
    const modelBuffer = FilamentProxy.getAssetByteBuffer(penguModelPath)
    const asset = engine.loadAsset(modelBuffer)
    const animator = asset.getAnimator()
    asset.releaseSourceData()

    return [asset, animator]
  }, [])

  const renderCallback: RenderCallback = useCallback(
    (_timestamp, _startTime, passedSeconds) => {
      penguAnimator.applyAnimation(0, passedSeconds)
      penguAnimator.updateBoneMatrices()

      engine.getCamera().lookAt(cameraPosition, cameraTarget, cameraUp)
    },
    [penguAnimator],
  )

  // Setup the 3D scene:
  useEffect(() => {
    // Create a default light:
    const indirectLightBuffer = FilamentProxy.getAssetByteBuffer(indirectLightPath)
    engine.setIndirectLight(indirectLightBuffer)

    // Create a directional light for supporting shadows
    const light = engine.createLightEntity('directional', 6500, 10000, 0, -1, 0, true)
    engine.getScene().addEntity(light)

    // Setup camera lens:
    const focalLengthInMillimeters = 28
    const near = 0.1
    const far = 1000
    const camera = engine.getCamera()
    camera.setLensProjection(focalLengthInMillimeters, viewAspectRatio, near, far)
  }, [viewAspectRatio])

  return <FilamentView style={styles.filamentView} engine={engine} renderCallback={renderCallback} />
}

const styles = StyleSheet.create({
  filamentView: {
    flex: 1,
    backgroundColor: 'lightblue',
  },
})
