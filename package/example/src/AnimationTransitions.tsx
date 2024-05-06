import { useNavigation } from '@react-navigation/native'
import * as React from 'react'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { Button, GestureResponderEvent, ScrollView, StyleSheet, View } from 'react-native'
import {
  Filament,
  Float3,
  useRenderCallback,
  useModel,
  useAssetAnimator,
  getAssetFromModel,
  FilamentProvider,
  useFilamentContext,
  useResource,
  useSkybox,
} from 'react-native-filament'
import { useDefaultLight } from './hooks/useDefaultLight'
import { getAssetPath } from './utils/getAssetPasth'
import { useSharedValue } from 'react-native-worklets-core'

const penguModelPath = getAssetPath('pengu.glb')
const pirateHatPath = getAssetPath('pirate.glb')

// Camera config:
const cameraPosition: Float3 = [0, 0, 8]
const cameraTarget: Float3 = [0, 0, 0]
const cameraUp: Float3 = [0, 1, 0]
const focalLengthInMillimeters = 28
const near = 0.1
const far = 1000

const animationInterpolationTime = 5

function Renderer() {
  const { camera, view, scene } = useFilamentContext()
  useDefaultLight()
  useSkybox({ color: '#88defb' })

  const pengu = useModel({ path: penguModelPath })
  const penguAsset = getAssetFromModel(pengu)
  const pirateHat = useModel({ path: pirateHatPath })
  const pirateHatAsset = getAssetFromModel(pirateHat)
  const pirateHatAnimator = useResource(() => {
    if (pirateHatAsset == null || penguAsset == null) {
      return undefined
    }
    return Promise.resolve(pirateHatAsset.createAnimatorWithAnimationsFrom(penguAsset))
  }, [pirateHatAsset, penguAsset])

  const isPirateHatAdded = useRef(true) // assets are added by default to the scene
  const penguAnimator = useAssetAnimator(penguAsset)
  const rootEntity = useMemo(() => penguAsset?.getRoot(), [penguAsset])

  const prevAnimationIndex = useSharedValue<number | undefined>(undefined)
  const prevAnimationStarted = useSharedValue<number | undefined>(undefined)
  const animationInterpolation = useSharedValue(0)
  const currentAnimationIndex = useSharedValue(0)

  const prevAspectRatio = useSharedValue(0)
  useRenderCallback(
    useCallback(
      ({ passedSeconds }) => {
        'worklet'

        const aspectRatio = view.getAspectRatio()
        if (prevAspectRatio.value !== aspectRatio) {
          prevAspectRatio.value = aspectRatio
          // Setup camera lens:
          camera.setLensProjection(focalLengthInMillimeters, aspectRatio, near, far)
          console.log('Setting up camera lens with aspect ratio:', aspectRatio)
        }

        camera.lookAt(cameraPosition, cameraTarget, cameraUp)

        if (pirateHatAnimator == null || penguAnimator == null) {
          return
        }

        // Update the animators to play the current animation
        penguAnimator.applyAnimation(currentAnimationIndex.value, passedSeconds)
        pirateHatAnimator.applyAnimation(currentAnimationIndex.value, passedSeconds)

        // Eventually apply a cross fade
        if (prevAnimationIndex.value != null) {
          if (prevAnimationStarted.value == null) {
            prevAnimationStarted.value = passedSeconds
          }
          animationInterpolation.value += passedSeconds - prevAnimationStarted.value!
          const alpha = animationInterpolation.value / animationInterpolationTime

          // Blend animations using a cross fade
          penguAnimator.applyCrossFade(prevAnimationIndex.value, prevAnimationStarted.value!, alpha)
          pirateHatAnimator.applyCrossFade(prevAnimationIndex.value, prevAnimationStarted.value!, alpha)

          // Reset the prev animation once the transition is completed
          if (alpha >= 1) {
            prevAnimationIndex.value = undefined
            prevAnimationStarted.value = undefined
            animationInterpolation.value = 0
          }
        }

        penguAnimator.updateBoneMatrices()
        pirateHatAnimator.updateBoneMatrices()
      },
      [
        view,
        prevAspectRatio,
        camera,
        pirateHatAnimator,
        penguAnimator,
        currentAnimationIndex,
        prevAnimationIndex,
        prevAnimationStarted,
        animationInterpolation,
      ]
    )
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
      <Filament style={styles.filamentView} enableTransparentRendering={false} />
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
  return (
    <FilamentProvider>
      <Renderer />
    </FilamentProvider>
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
    maxHeight: 120,
    width: '100%',
  },
})
