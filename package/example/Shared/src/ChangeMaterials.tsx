import * as React from 'react'

import { Button, StyleSheet } from 'react-native'
import { FilamentView, useBuffer, Camera, FilamentScene, DefaultLight, EntitySelector, Model } from 'react-native-filament'
import { SafeAreaView } from 'react-native-safe-area-context'

import RocketGlb from '~/assets/rocket.glb'

const baseColorBlueImage = require('~/assets/rocket_BaseColor_Blue.png')

function Renderer() {
  const [showBlue, setShowBlue] = React.useState(false)
  const blueBaseColorBuffer = useBuffer({ source: baseColorBlueImage })
  const materialName = 'Toy Ship'

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FilamentView style={styles.filamentView}>
        <Camera />
        <DefaultLight />

        <Model source={RocketGlb} translate={[0, -1, 0]}>
          {blueBaseColorBuffer != null && showBlue && (
            <>
              <EntitySelector byName="Tip" textureMap={{ materialName, textureSource: blueBaseColorBuffer }} />
              <EntitySelector byName="Wings" textureMap={{ materialName, textureSource: blueBaseColorBuffer }} />
            </>
          )}
        </Model>
      </FilamentView>
      <Button
        title="Change Color"
        onPress={() => {
          setShowBlue(true)
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
