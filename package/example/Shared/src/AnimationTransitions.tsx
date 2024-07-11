import { useNavigation } from '@react-navigation/native'
import * as React from 'react'
import { Alert, Button, ScrollView, StyleSheet, View } from 'react-native'
import { FilamentScene, FilamentView, Camera, Model, Animator, AnimationItem, Entity, DefaultLight } from 'react-native-filament'
import { useSharedValue } from 'react-native-worklets-core'
import HipHopGirlGlb from '~/assets/hiphopgirl.glb'
import { SafeAreaView } from 'react-native-safe-area-context'

const animationInterpolationTime = 5

function Renderer() {
  const currentAnimationIndex = useSharedValue(1)
  const [animations, setAnimations] = React.useState<AnimationItem[]>([])

  const navigation = useNavigation()

  const onPressModel = (entity: Entity) => {
    Alert.alert('Model pressed by entity with ID ' + entity.id)
  }

  return (
    <View style={styles.container}>
      <FilamentView style={styles.filamentView}>
        <Camera cameraPosition={[0, 1, 4]} cameraTarget={[0, 1, 0]} />
        <DefaultLight />

        <Model source={HipHopGirlGlb} onPress={onPressModel}>
          <Animator
            animationIndex={currentAnimationIndex}
            transitionDuration={animationInterpolationTime}
            onAnimationsLoaded={setAnimations}
          />
        </Model>
      </FilamentView>

      <ScrollView style={styles.btnContainer}>
        <Button
          title="Navigate to test screen"
          onPress={() => {
            navigation.navigate('Test')
          }}
        />
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
  const [count, setCount] = React.useState(0)
  const increment = () => setCount((c) => c + 1)

  return (
    <SafeAreaView style={styles.container}>
      <FilamentScene key={count}>
        <Renderer />
      </FilamentScene>
      <Button title="Rerender" onPress={increment} />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filamentView: {
    flex: 1,
  },
  btnContainer: {
    position: 'absolute',
    bottom: 0,
    maxHeight: 120,
    width: '100%',
  },
})
