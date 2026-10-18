import React, { useState } from 'react'
import { Button, StyleSheet, View } from 'react-native'
import { Camera, DefaultLight, EntitySelector, FilamentScene, FilamentView, Model } from 'react-native-filament'

const rocket = require('../../assets/rocket.glb')
const blueBaseColor = require('../../assets/rocket_BaseColor_Blue.png')
const materialName = 'Toy Ship'

function Renderer() {
  const [showBlue, setShowBlue] = useState(false)
  return (
    <View style={styles.container}>
      <FilamentView style={styles.filamentView} transparent>
        <Camera />
        <DefaultLight />
        <Model source={rocket} translate={[0, -1, 0]}>
          {showBlue && (
            <>
              <EntitySelector byName="Tip" textureMap={{ materialName, textureSource: blueBaseColor }} />
              <EntitySelector byName="Wings" textureMap={{ materialName, textureSource: blueBaseColor }} />
            </>
          )}
        </Model>
      </FilamentView>
      <Button title="Change Color" onPress={() => setShowBlue(true)} />
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
  container: { flex: 1 },
  filamentView: { flex: 1, backgroundColor: 'lightblue' },
})
