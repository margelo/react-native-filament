import { useNavigation } from '@react-navigation/native'
import * as React from 'react'
import { useCallback, useMemo, useRef } from 'react'
import { Button, GestureResponderEvent, ScrollView, StyleSheet, View } from 'react-native'
import {
  useModel,
  useAnimator,
  getAssetFromModel,
  useFilamentContext,
  FilamentContext,
  FilamentView,
  Camera,
  RenderCallback,
} from 'react-native-filament'
import { useSharedValue } from 'react-native-worklets-core'
import PenguGlb from '~/assets/pengu.glb'
import PirateGlb from '~/assets/pirate.glb'
import { DefaultLight } from './components/DefaultLight'

const animationInterpolationTime = 5

function Renderer() {
  const { camera, view, scene } = useFilamentContext()

  const pengu = useModel(PenguGlb)
  const penguAnimator = useAnimator(pengu)
  const pirateHat = useModel(PirateGlb)
  const pirateHatAsset = getAssetFromModel(pirateHat)
  const pirateHatInstance = useMemo(() => pirateHatAsset?.getInstance(), [pirateHatAsset])

  // Sync pirate hat animation with pengu
  React.useEffect(() => {
    if (penguAnimator == null || pirateHatInstance == null) return
    const id = penguAnimator.addToSyncList(pirateHatInstance)
    return () => {
      penguAnimator.removeFromSyncList(id)
    }
  }, [penguAnimator, pirateHatInstance])

  const isPirateHatAdded = useRef(true) // assets are added by default to the scene

  const prevAnimationIndex = useSharedValue<number | undefined>(undefined)
  const prevAnimationStarted = useSharedValue<number | undefined>(undefined)
  const animationInterpolation = useSharedValue(0)
  const currentAnimationIndex = useSharedValue(0)

  const renderCallback: RenderCallback = useCallback(
    ({ passedSeconds }) => {
      'worklet'

      if (penguAnimator == null) {
        return
      }

      // Update the animators to play the current animation
      penguAnimator.applyAnimation(currentAnimationIndex.value, passedSeconds)

      // Eventually apply a cross fade
      if (prevAnimationIndex.value != null) {
        if (prevAnimationStarted.value == null) {
          prevAnimationStarted.value = passedSeconds
        }
        animationInterpolation.value += passedSeconds - prevAnimationStarted.value!
        const alpha = animationInterpolation.value / animationInterpolationTime

        // Blend animations using a cross fade
        penguAnimator.applyCrossFade(prevAnimationIndex.value, prevAnimationStarted.value!, alpha)

        // Reset the prev animation once the transition is completed
        if (alpha >= 1) {
          prevAnimationIndex.value = undefined
          prevAnimationStarted.value = undefined
          animationInterpolation.value = 0
        }
      }

      penguAnimator.updateBoneMatrices()
    },
    [penguAnimator, currentAnimationIndex, prevAnimationIndex, prevAnimationStarted, animationInterpolation]
  )

  const animations = useMemo(() => {
    if (penguAnimator == null) return []
    const count = penguAnimator.getAnimationCount()
    const names = []
    for (let i = 0; i < count; i++) {
      names.push(penguAnimator.getAnimationName(i))
    }
    return names
  }, [penguAnimator])

  const navigation = useNavigation()

  const penguAsset = getAssetFromModel(pengu)
  const renderableEntities = useMemo(() => {
    if (penguAsset == null) return []
    return penguAsset.getRenderableEntities()
  }, [penguAsset])

  const onTouchStart = useCallback(
    async (event: GestureResponderEvent) => {
      if (renderableEntities == null) return

      const { locationX, locationY } = event.nativeEvent
      const entity = await view.pickEntity(locationX, locationY)
      if (entity == null) {
        console.log('No entity was picked')
        return
      }
      console.log('Picked entity:', entity)

      // Check if the pengu was picked
      for (const renderableEntity of renderableEntities) {
        if (entity?.id === renderableEntity.id) {
          console.log('Pengu was picked!')
          return
        }
      }
    },
    [renderableEntities, view]
  )

  return (
    <View style={styles.container} onTouchStart={onTouchStart}>
      <FilamentView style={styles.filamentView} renderCallback={renderCallback}>
        <Camera />
        <DefaultLight />
      </FilamentView>

      <ScrollView style={styles.btnContainer}>
        <Button
          title="Navigate to test screen"
          onPress={() => {
            navigation.navigate('Test')
          }}
        />
        <Button
          title="Toggle Pirate Hat"
          onPress={() => {
            if (pirateHat.state === 'loaded') {
              if (isPirateHatAdded.current) {
                console.log('Removing pirate hat')
                scene.removeAssetEntities(pirateHat.asset)
                isPirateHatAdded.current = false
              } else {
                console.log('Adding pirate hat')
                scene.addAssetEntities(pirateHat.asset)
                isPirateHatAdded.current = true
              }
            }
          }}
        />
        {animations.map((name, i) => (
          <Button
            key={name}
            title={name}
            onPress={() => {
              prevAnimationIndex.value = currentAnimationIndex.value
              currentAnimationIndex.value = i
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
    <View style={styles.container}>
      <FilamentContext key={count}>
        <Renderer />
      </FilamentContext>
      <Button title="Create a new react element" onPress={increment} />
    </View>
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
