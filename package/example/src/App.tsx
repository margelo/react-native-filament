import * as React from 'react'

import { StyleSheet } from 'react-native'
import { FilamentView } from 'react-native-filament'

export default function App() {
  return <FilamentView style={styles.filamentView} />
}

const styles = StyleSheet.create({
  filamentView: {
    flex: 1,
    backgroundColor: 'lightblue',
  },
})
