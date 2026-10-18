import React, { useEffect, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { callback } from 'react-native-nitro-modules'
import { Filament, NativeFilamentView, runOnRenderThread, type FilamentView } from 'react-native-filament'

export function FrameListenerExample() {
  const [view, setView] = useState<FilamentView>()

  useEffect(() => {
    if (view == null) return
    const starting = Filament.createEngine({}).then(async (engine) => {
      const target = await engine.createViewTarget(view, {})
      const subscription = await runOnRenderThread(engine, () => {
        'worklet'
        return engine.addOnFrameListener((frame) => {
          const t = frame.elapsedSeconds
          target.setClearOptions({ color: [0.5 + 0.5 * Math.sin(t), 0.5 + 0.5 * Math.sin(t + 2.1), 0.5 + 0.5 * Math.sin(t + 4.2), 1] })
          return true
        })
      })
      return { engine, subscription }
    })
    return () => {
      starting.then(({ engine, subscription }) => {
        subscription.remove()
        engine.shutdown()
      })
    }
  }, [view])

  return (
    <View style={styles.container}>
      <NativeFilamentView style={styles.container} hybridRef={callback(setView)} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
})
