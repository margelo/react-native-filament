import * as React from 'react'

import { Button, StyleSheet, View } from 'react-native'
import { FilamentView, useBuffer, useModel, useFilamentContext, useWorkletCallback, Camera, FilamentScene } from 'react-native-filament'

import PenguModel from '~/assets/pengu.glb'
import LeftEyeTexture from '~/assets/eye_full_texture_left_blue.jpg'
import RightEyeTexture from '~/assets/eye_full_texture_right_blue.jpg'
import { DefaultLight } from './components/DefaultLight'

function Renderer() {
  const { renderableManager } = useFilamentContext()

  const pengu = useModel(PenguModel)
  const blueLeftEyeBuffer = useBuffer({ source: LeftEyeTexture })
  const blueRightEyeBuffer = useBuffer({ source: RightEyeTexture })

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
  })

  return (
    <View style={styles.container}>
      <FilamentView style={styles.filamentView}>
        <Camera />
        <DefaultLight />
      </FilamentView>
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
    <FilamentScene>
      <Renderer />
    </FilamentScene>
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
