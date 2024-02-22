import * as React from 'react'

import { StyleSheet, View } from 'react-native'
import { FilamentView } from 'react-native-filament'

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
