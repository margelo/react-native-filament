import * as React from 'react'
import { useEffect, useRef } from 'react'

import { Platform, StyleSheet, View } from 'react-native'
import { Filament, useEngine, Float3, useRenderCallback, useAsset, useModel, useRenderableManager } from 'react-native-filament'

const penguModelPath = Platform.select({
  android: 'custom/pengu.glb',
  ios: 'pengu.glb',
})!

const indirectLightPath = Platform.select({
  android: 'custom/default_env_ibl.ktx',
  ios: 'default_env_ibl.ktx',
})!

const leftEyeTexturePath = Platform.select({
  android: 'custom/eye_full_texture_left_blue.jpg',
  ios: 'eye_full_texture_left_blue.jpg',
})!
const rightEyeTexturePath = Platform.select({
  android: 'custom/eye_full_texture_right_blue.jpg',
  ios: 'eye_full_texture_right_blue.jpg',
})!

// Camera config:
const cameraPosition: Float3 = [0, 0, 8]
const cameraTarget: Float3 = [0, 0, 0]
const cameraUp: Float3 = [0, 1, 0]
const focalLengthInMillimeters = 28
const near = 0.1
const far = 1000

export function ChangeMaterials() {
  const engine = useEngine()
  const renderableManager = useRenderableManager(engine)

  const pengu = useModel({ engine: engine, path: penguModelPath })
  const blueLeftEyeBuffer = useAsset({ path: leftEyeTexturePath })
  const blueRightEyeBuffer = useAsset({ path: rightEyeTexturePath })

  const penguAsset = pengu.state === 'loaded' ? pengu.asset : undefined
  useEffect(() => {
    if (penguAsset == null || blueLeftEyeBuffer == null || blueRightEyeBuffer == null) return

    const leftEye = penguAsset.getFirstEntityByName('Brown Dark Stylised.003')
    if (leftEye == null) {
      console.warn('Could not find left eye entity')
      return
    }
    const rightEye = penguAsset.getFirstEntityByName('Brown Dark Stylised.004')
    if (rightEye == null) {
      console.warn('Could not find right eye entity')
      return
    }

    renderableManager.changeMaterialTextureMap(leftEye, 'Eye_Left.001', blueLeftEyeBuffer, 'sRGB')
    renderableManager.changeMaterialTextureMap(rightEye, 'Eye_Right.002', blueRightEyeBuffer, 'sRGB')
  }, [blueLeftEyeBuffer, blueRightEyeBuffer, engine, penguAsset, renderableManager])

  const light = useAsset({ path: indirectLightPath })
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
  useRenderCallback(engine, () => {
    const view = engine.getView()
    const aspectRatio = view.aspectRatio
    if (prevAspectRatio.current !== aspectRatio) {
      prevAspectRatio.current = aspectRatio
      // Setup camera lens:
      const camera = engine.getCamera()
      camera.setLensProjection(focalLengthInMillimeters, aspectRatio, near, far)
    }

    engine.getCamera().lookAt(cameraPosition, cameraTarget, cameraUp)
  })

  return (
    <View style={styles.container}>
      <Filament style={styles.filamentView} engine={engine} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filamentView: {
    flex: 1,
    backgroundColor: 'lightblue',
  },
  btnContainer: {
    height: 200,
    width: '100%',
    position: 'absolute',
    bottom: 0,
  },
})
