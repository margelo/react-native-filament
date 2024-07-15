import * as React from 'react'

import { Button, StyleSheet } from 'react-native'
import {
  FilamentView,
  useBuffer,
  useModel,
  useFilamentContext,
  useWorkletCallback,
  Camera,
  FilamentScene,
  DefaultLight,
  ModelRenderer,
} from 'react-native-filament'
import { SafeAreaView } from 'react-native-safe-area-context'

import Model from '~/assets/rocket.glb'

const baseColorBlueImage = require('~/assets/rocket_BaseColor_Blue.png')

function Renderer() {
  const { renderableManager } = useFilamentContext()

  const rocket = useModel(Model)
  const blueBaseColorBuffer = useBuffer({ source: baseColorBlueImage })

  const asset = rocket.state === 'loaded' ? rocket.asset : undefined
  const changeColor = useWorkletCallback(() => {
    'worklet'

    if (asset == null || blueBaseColorBuffer == null) return

    const tipEntity = asset.getFirstEntityByName('Tip')
    const wingsEntity = asset.getFirstEntityByName('Wings')

    renderableManager.changeMaterialTextureMap(tipEntity!, 'Toy Ship', blueBaseColorBuffer, 'sRGB')
    renderableManager.changeMaterialTextureMap(wingsEntity!, 'Toy Ship', blueBaseColorBuffer, 'sRGB')
    console.log('Color changed :)')
  })

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FilamentView style={styles.filamentView}>
        <Camera />
        <DefaultLight />

        <ModelRenderer
          model={rocket}
          scale={[1.2, 1.2, 1.2]}
          rotate={{
            axis: [0, 1, 0],
            angleInRadians: (45 * Math.PI) / 180,
          }}
          position={[0, -1, 0]}
        />
      </FilamentView>
      <Button
        title="Change Color"
        onPress={() => {
          changeColor()
        }}
      />
    </SafeAreaView>
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
