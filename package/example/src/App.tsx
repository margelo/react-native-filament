import * as React from 'react'
import { useCallback } from 'react'

import { StyleSheet } from 'react-native'
import { FilamentProxy, FilamentView } from 'react-native-filament'

const engine = FilamentProxy.createEngine()

export default function App() {
  const renderCallback = useCallback(() => {
    // Note: we can't render without any entities in the scene, will cause a crash
  }, [])

  return <FilamentView style={styles.filamentView} engine={engine} renderCallback={renderCallback} />
}

const styles = StyleSheet.create({
  filamentView: {
    flex: 1,
    backgroundColor: 'lightblue',
  },
})
