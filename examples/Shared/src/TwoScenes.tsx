import React from 'react'
import { StyleSheet, View } from 'react-native'
import { Camera, DefaultLight, FilamentScene, FilamentView, Model } from 'react-native-filament'
import { useSharedValue, useDerivedValue, withRepeat, withTiming } from 'react-native-reanimated'
import DroneGlb from '@assets/buster_drone.glb'
import CoinGlb from '@assets/coin.glb'

// Two independent scenes on one screen, each with its own engine, view and render loop.
function Spinning({ source }: { source: number }) {
  const rotation = useSharedValue(0)
  React.useEffect(() => {
    rotation.value = withRepeat(withTiming(Math.PI * 2, { duration: 4000 }), -1, false)
  }, [rotation])
  const rotate = useDerivedValue(() => [0, rotation.value, 0] as [number, number, number])

  return (
    <FilamentView style={styles.view}>
      <Camera />
      <DefaultLight />
      <Model source={source} transformToUnitCube rotate={rotate} />
    </FilamentView>
  )
}

export function TwoScenes() {
  return (
    <View style={styles.container}>
      <FilamentScene>
        <Spinning source={DroneGlb} />
      </FilamentScene>
      <FilamentScene>
        <Spinning source={CoinGlb} />
      </FilamentScene>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  view: { flex: 1, backgroundColor: 'lightblue' },
})
