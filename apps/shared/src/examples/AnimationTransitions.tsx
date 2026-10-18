import React, { useState } from 'react'
import { Alert, Button, ScrollView, StyleSheet, View } from 'react-native'
import { useSharedValue } from 'react-native-reanimated'
import { Animator, Camera, DefaultLight, FilamentScene, FilamentView, Model, type AnimationItem, type Entity } from 'react-native-filament'

const hipHopGirl = require('../../assets/hiphopgirl.glb')
const animationInterpolationTime = 5

function Renderer() {
  const currentAnimationIndex = useSharedValue(1)
  const [animations, setAnimations] = useState<AnimationItem[]>([])

  const onPressModel = (entity: Entity) => {
    Alert.alert(`Model pressed by entity with ID ${entity}`)
  }

  return (
    <View style={styles.container}>
      <FilamentView style={styles.container}>
        <Camera cameraPosition={[0, 1, 4]} cameraTarget={[0, 1, 0]} />
        <DefaultLight />
        <Model source={hipHopGirl} onPress={onPressModel}>
          <Animator animationIndex={currentAnimationIndex} transitionDuration={animationInterpolationTime} onAnimationsLoaded={setAnimations} />
        </Model>
      </FilamentView>
      <ScrollView style={styles.buttons}>
        {animations.map(({ name, index }) => (
          <Button
            key={name}
            title={name}
            onPress={() => {
              currentAnimationIndex.value = index
            }}
          />
        ))}
      </ScrollView>
    </View>
  )
}

export function AnimationTransitions() {
  const [count, setCount] = useState(0)
  return (
    <View style={styles.container}>
      <FilamentScene key={count}>
        <Renderer />
      </FilamentScene>
      <Button title="Rerender" onPress={() => setCount((value) => value + 1)} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  buttons: { position: 'absolute', bottom: 0, maxHeight: 120, width: '100%' },
})
