import React, { useCallback, useEffect, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { Easing, useDerivedValue, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated'
import { Animator, Camera, DefaultLight, FilamentScene, FilamentView, Model, type AnimationItem, type Entity, type Float3 } from 'react-native-filament'

const drone = require('../../assets/buster_drone.glb')

function DroneScene() {
  const angle = useSharedValue(0)
  const rotate = useDerivedValue<Float3>(() => [0, angle.value, 0])
  const [animations, setAnimations] = useState<AnimationItem[]>([])
  const [animationIndex, setAnimationIndex] = useState(0)
  const [press, setPress] = useState<{ count: number; entity: Entity }>()

  useEffect(() => {
    angle.value = withRepeat(withTiming(2 * Math.PI, { duration: 6000, easing: Easing.linear }), -1, false)
  }, [angle])

  const onPress = useCallback(
    (entity: Entity) => {
      setPress((previous) => ({ count: (previous?.count ?? 0) + 1, entity }))
      setAnimationIndex((index) => (animations.length === 0 ? 0 : (index + 1) % animations.length))
    },
    [animations.length]
  )

  const current = animations[animationIndex]
  return (
    <View style={styles.container}>
      <FilamentView style={styles.container}>
        <Camera cameraPosition={[0, 0.6, 4]} />
        <DefaultLight />
        <Model source={drone} transformToUnitCube rotate={rotate} onPress={onPress}>
          <Animator animationIndex={animationIndex} transitionDuration={0.4} onAnimationsLoaded={setAnimations} />
        </Model>
      </FilamentView>
      <Text style={styles.caption}>
        {current == null ? 'Loading…' : `Playing “${current.name}” of ${animations.length}. `}
        {press == null ? 'Tap the drone.' : `Tapped ${press.count}×, last on entity ${press.entity}.`}
      </Text>
    </View>
  )
}

export function ReactScene() {
  return (
    <FilamentScene fallback={<Text style={styles.caption}>Starting Filament…</Text>}>
      <DroneScene />
    </FilamentScene>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  caption: { padding: 12, textAlign: 'center' },
})
