import React, { useEffect, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { callback } from 'react-native-nitro-modules'
import { Filament, NativeFilamentView, type Engine, type FilamentView } from 'react-native-filament'

export function ClearColorExample() {
  const [view, setView] = useState<FilamentView>()
  const [engine, setEngine] = useState<Engine>()

  useEffect(() => {
    if (view == null) return
    const creating = Filament.createEngine({})
    creating.then(async (created) => {
      await created.createViewTarget(view, { clearOptions: { color: [0.05, 0.35, 0.8, 1] } })
      setEngine(created)
    })
    return () => {
      creating.then((created) => created.shutdown())
    }
  }, [view])

  return (
    <View style={styles.container}>
      <NativeFilamentView style={styles.filament} hybridRef={callback(setView)} />
      <Text testID="clear-color-backend" style={styles.label}>
        {engine == null ? 'Starting…' : `Rendering with ${engine.backend}`}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  filament: { flex: 1 },
  label: { position: 'absolute', bottom: 40, alignSelf: 'center', fontSize: 18, color: 'white' },
})
