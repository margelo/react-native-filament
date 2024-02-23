import * as React from 'react'

import { StyleSheet, View } from 'react-native'
import { FilamentView, FilamentProxy } from 'react-native-filament'

const engine = FilamentProxy.createEngine()
const renderer = engine.createRenderer()
const scene = engine.createScene()
const camera = engine.createCamera()
const view = engine.createView()
view.scene = scene
view.camera = camera

export default function App() {
  return (
    <View style={styles.container}>
      <FilamentView style={styles.filamentView} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filamentView: {
    width: 350,
    height: 350,
    backgroundColor: 'black',
  },
})
