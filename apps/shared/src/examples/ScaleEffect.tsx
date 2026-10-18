import React from 'react'
import { Button, StyleSheet, View } from 'react-native'
import { useDerivedValue, useSharedValue, withSpring } from 'react-native-reanimated'
import { Camera, DefaultLight, FilamentScene, FilamentView, Model, type Float3 } from 'react-native-filament'

const coin = require('../../assets/coin.glb')
const tilt: Float3 = [75 * (Math.PI / 180), 0, 0]

function Renderer() {
  const size = useSharedValue(0)
  const scale = useDerivedValue<Float3>(() => [size.value, size.value, size.value])
  const onScale = () => {
    size.value = 0
    size.value = withSpring(1, { mass: 3, stiffness: 1000, damping: 500 })
  }
  return (
    <View style={styles.container}>
      <FilamentView style={styles.filamentView} transparent>
        <Camera />
        <DefaultLight />
        <Model source={coin} rotate={tilt} scale={scale} />
      </FilamentView>
      <Button title="Scale" onPress={onScale} />
    </View>
  )
}

export function ScaleEffect() {
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
