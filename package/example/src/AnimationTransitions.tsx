import { useNavigation } from '@react-navigation/native'
import * as React from 'react'
import { useEffect, useMemo, useRef } from 'react'
import { Button, ScrollView, StyleSheet, View } from 'react-native'
import {
  Filament,
  useEngine,
  Float3,
  useRenderCallback,
  useModel,
  useView,
  useCamera,
  Engine,
  useAssetAnimator,
  getAssetFromModel,
  useWorkletCallback,
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

function Renderer({ engine }: { engine: Engine }) {
  useDefaultLight(engine)
  const view = useView(engine)
  const camera = useCamera(engine)

  const pengu = useModel({ engine: engine, path: penguModelPath })
  const penguAsset = getAssetFromModel(pengu)
  const pirateHat = useModel({ engine: engine, path: pirateHatPath })
  const pirateHatAsset = getAssetFromModel(pirateHat)
  const pirateHatAnimator = useMemo(() => {
    if (pirateHatAsset == null || penguAsset == null) {
      return undefined
    }
    return pirateHatAsset.createAnimatorWithAnimationsFrom(penguAsset)
  }, [penguAsset, pirateHatAsset])
  useEffect(() => {
    return () => {
      if (pirateHatAnimator != null) {
        pirateHatAnimator.release?.()
      }
    }
  }, [pirateHatAnimator])

  const isPirateHatAdded = useRef(true) // assets are added by default to the scene
  const penguAnimator = useAssetAnimator(penguAsset)

  const prevAnimationIndex = useSharedValue<number | undefined>(undefined)
  const prevAnimationStarted = useSharedValue<number | undefined>(undefined)
  const animationInterpolation = useSharedValue(0)
  const currentAnimationIndex = useSharedValue(0)

  const prevAspectRatio = useSharedValue(0)
  useRenderCallback(
    engine,
    useWorkletCallback(
      (_timestamp, _startTime, passedSeconds) => {
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

  return (
    <View style={styles.container}>
      <Filament style={styles.filamentView} engine={engine} />
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
                engine.getScene().removeAssetEntities(pirateHat.asset)
                isPirateHatAdded.current = false
              } else {
                console.log('Adding pirate hat')
                engine.getScene().addAssetEntities(pirateHat.asset)
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
  const engine = useEngine()

  if (engine == null) return null
  return <Renderer engine={engine} />
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filamentView: {
    flex: 1,
    backgroundColor: 'lightblue',
  },
  btnContainer: {
    height: 200,
    width: '100%',
    position: 'absolute',
    bottom: 0,
  },
})
