import * as React from 'react'
import { useCallback, useRef } from 'react'

import { Button, StyleSheet, View } from 'react-native'
import {
  Filament,
  Float3,
  useRenderCallback,
  useAsset,
  useModel,
  FilamentProvider,
  useFilamentContext,
  useWorkletCallback,
} from 'react-native-filament'
import { getAssetPath } from './utils/getAssetPasth'
import { useDefaultLight } from './hooks/useDefaultLight'

const penguModelPath = getAssetPath('pengu.glb')
const leftEyeTexturePath = getAssetPath('eye_full_texture_left_blue.jpg')
const rightEyeTexturePath = getAssetPath('eye_full_texture_right_blue.jpg')

// Camera config:
const cameraPosition: Float3 = [0, 0, 8]
const cameraTarget: Float3 = [0, 0, 0]
const cameraUp: Float3 = [0, 1, 0]
const focalLengthInMillimeters = 28
const near = 0.1
const far = 1000

function Renderer() {
  const { camera, view, renderableManager } = useFilamentContext()

  useDefaultLight()

  const pengu = useModel({ path: penguModelPath })
  const blueLeftEyeBuffer = useAsset({ path: leftEyeTexturePath })
  const blueRightEyeBuffer = useAsset({ path: rightEyeTexturePath })

  const penguAsset = pengu.state === 'loaded' ? pengu.asset : undefined
  const changeEyes = useWorkletCallback(() => {
    'worklet'

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

    renderableManager.setAssetEntitiesOpacity(penguAsset, 1.0)

    renderableManager.changeMaterialTextureMap(leftEye, 'Eye_Left.001', blueLeftEyeBuffer, 'sRGB')
    renderableManager.changeMaterialTextureMap(rightEye, 'Eye_Right.002', blueRightEyeBuffer, 'sRGB')
  }, [blueLeftEyeBuffer, blueRightEyeBuffer, penguAsset, renderableManager])

  const prevAspectRatio = useRef(0)
  useRenderCallback(
    useCallback(() => {
      'worklet'
      const aspectRatio = view.getAspectRatio()
      if (prevAspectRatio.current !== aspectRatio) {
        prevAspectRatio.current = aspectRatio
        // Setup camera lens:
        camera.setLensProjection(focalLengthInMillimeters, aspectRatio, near, far)
      }

      camera.lookAt(cameraPosition, cameraTarget, cameraUp)
    }, [view, camera, prevAspectRatio])
  )

  return (
    <View style={styles.container}>
      <Filament style={styles.filamentView} />
      <Button
        title="Change Eyes"
        onPress={() => {
          changeEyes()
        }}
      />
    </View>
  )
}

export function ChangeMaterials() {
  return (
    <FilamentProvider>
      <Renderer />
    </FilamentProvider>
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
})
