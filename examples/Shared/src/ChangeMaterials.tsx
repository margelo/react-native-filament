import * as React from 'react'

import { Button, StyleSheet } from 'react-native'
import { FilamentView, useBuffer, Camera, FilamentScene, DefaultLight, EntitySelector, Model } from 'react-native-filament'
import { SafeAreaView } from 'react-native-safe-area-context'

import RocketGlb from '@assets/rocket.glb'

const baseColorBlueImage = require('@assets/rocket_BaseColor_Blue.png')

function Renderer() {
  // Regression test for a crash on scene teardown: after changing a texture map, navigating back
  // from this screen must not abort with filament's "destroying MaterialInstance which is still
  // in use by Renderable" precondition. Every press re-applies the texture map, which also
  // exercises destroying the superseded material instance and texture of a slot.
  const [applyCount, setApplyCount] = React.useState(0)
  const blueBaseColorBuffer = useBuffer({ source: baseColorBlueImage })
  const materialName = 'Toy Ship'

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FilamentView style={styles.filamentView}>
        <Camera />
        <DefaultLight />

        <Model source={RocketGlb} translate={[0, -1, 0]}>
          {blueBaseColorBuffer != null && applyCount > 0 && (
            <React.Fragment key={applyCount}>
              <EntitySelector byName="Tip" textureMap={{ materialName, textureSource: blueBaseColorBuffer }} />
              <EntitySelector byName="Wings" textureMap={{ materialName, textureSource: blueBaseColorBuffer }} />
            </React.Fragment>
          )}
        </Model>
      </FilamentView>
      <Button
        title="Change Color"
        onPress={() => {
          setApplyCount((count) => count + 1)
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
