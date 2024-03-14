import * as React from 'react'
import { useEffect, useMemo, useRef } from 'react'

import { Button, Platform, ScrollView, StyleSheet, View } from 'react-native'
import { Filament, useEngine, Float3, useRenderCallback, useAsset, useModel, useWorld, useRigidBody } from 'react-native-filament'

const getPath = (path: string) => {
  if (Platform.OS === 'android') {
    // TODO: Right now we bundle the asset using react-native-asset, which on android adds a custom/ prefix
    // Fix by implementing proper asset loading, see: https://github.com/margelo/react-native-filament/issues/61
    return `custom/${path}`
  }
  return path
}
const penguModelPath = getPath('pengu.glb')
const indirectLightPath = getPath('default_env_ibl.ktx')
const pirateHatPath = getPath('pirate.glb')
const coinPath = getPath('coin.glb')

// Camera config:
const cameraPosition: Float3 = [0, 0, 8]
const cameraTarget: Float3 = [0, 0, 0]
const cameraUp: Float3 = [0, 1, 0]
const focalLengthInMillimeters = 28
const near = 0.1
const far = 1000

const animationInterpolationTime = 5

export default function App() {
  const engine = useEngine()
  const world = useWorld(0, -0.001, 0)

  const coin = useModel({ engine: engine, path: coinPath })
  const coinBody = useRigidBody({
    mass: 0.005, // A coin weights ~5g
    origin: [0, 5, 0],
    shape: [0.01, 0.01, 0.01],
    friction: 1,
    damping: [0.0, 0.5],
    activationState: 'disable_deactivation',
  })
  // Add the rigid body to the world once the coin is loaded
  // TODO: Combine with hooks API!
  useEffect(() => {
    if (coin.state === 'loaded') {
      world.addRigidBody(coinBody)
      // engine.setEntityPosition(coin.asset.getRoot(), [0, 5, 0], false)
      // engine.setEntityScale(coin.asset.getRoot(), [0.5, 0.5, 0.5], true)
    }
  }, [coin, world, coinBody, engine])

  const pengu = useModel({ engine: engine, path: penguModelPath })
  const light = useAsset({ path: indirectLightPath })
  const pirateHat = useModel({ engine: engine, path: pirateHatPath })
  const pirateHatAnimator = useMemo(() => {
    if (pirateHat.state !== 'loaded' || pengu.state !== 'loaded') {
      return undefined
    }
    return pirateHat.asset.createAnimatorWithAnimationsFrom(pengu.asset)
  }, [pengu, pirateHat])
  const isPirateHatAdded = useRef(true) // assets are added by default to the scene

  const prevAnimationIndex = useRef<number>()
  const prevAnimationStarted = useRef<number>()
  const animationInterpolation = useRef(0)
  const currentAnimationIndex = useRef(0)

  useEffect(() => {
    if (light == null) return
    // create a default light
    engine.setIndirectLight(light)

    // Create a directional light for supporting shadows
    const directionalLight = engine.createLightEntity('directional', 6500, 10000, 0, -1, 0, true)
    engine.getScene().addEntity(directionalLight)
    return () => {
      // TODO: Remove directionalLight from scene
    }
  }, [engine, light])

  const prevAspectRatio = useRef(0)
  const coinEntity = coin.state === 'loaded' ? coin.asset.getRoot() : undefined
  useRenderCallback(engine, (_timestamp, _startTime, passedSeconds) => {
    const view = engine.getView()
    const aspectRatio = view.aspectRatio
    if (prevAspectRatio.current !== aspectRatio) {
      prevAspectRatio.current = aspectRatio
      // Setup camera lens:
      const camera = engine.getCamera()
      camera.setLensProjection(focalLengthInMillimeters, aspectRatio, near, far)
    }

    // Update physics:
    if (passedSeconds > 5) {
      world.stepSimulation(1 / 20, 0, 1 / 60)
      if (coinEntity != null) {
        engine.updateTransformByRigidBody(coinEntity, coinBody)
        engine.setEntityScale(coinEntity, [0.5, 0.5, 0.5], true)
      }
    }

    engine.getCamera().lookAt(cameraPosition, cameraTarget, cameraUp)

    if (pengu.state !== 'loaded' || pirateHatAnimator == null) {
      return
    }

    // Update the animators to play the current animation
    pengu.animator.applyAnimation(currentAnimationIndex.current, passedSeconds)
    pirateHatAnimator.applyAnimation(currentAnimationIndex.current, passedSeconds)

    // Eventually apply a cross fade
    if (prevAnimationIndex.current != null) {
      if (prevAnimationStarted.current == null) {
        prevAnimationStarted.current = passedSeconds
      }
      animationInterpolation.current += passedSeconds - prevAnimationStarted.current
      const alpha = animationInterpolation.current / animationInterpolationTime

      // Blend animations using a cross fade
      pengu.animator.applyCrossFade(prevAnimationIndex.current, prevAnimationStarted.current!, alpha)
      pirateHatAnimator.applyCrossFade(prevAnimationIndex.current, prevAnimationStarted.current!, alpha)

      // Reset the prev animation once the transition is completed
      if (alpha >= 1) {
        prevAnimationIndex.current = undefined
        prevAnimationStarted.current = undefined
        animationInterpolation.current = 0
      }
    }

    pengu.animator.updateBoneMatrices()
    pirateHatAnimator.updateBoneMatrices()
  })

  const animations = useMemo(() => {
    if (pengu.state !== 'loaded') return []
    const count = pengu.animator.getAnimationCount()
    const names = []
    for (let i = 0; i < count; i++) {
      names.push(pengu.animator.getAnimationName(i))
    }
    return names
  }, [pengu])

  return (
    <View style={styles.container}>
      <Filament style={styles.filamentView} engine={engine} />
      <ScrollView style={styles.btnContainer}>
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
              prevAnimationIndex.current = currentAnimationIndex.current
              currentAnimationIndex.current = i
            }}
          />
        ))}
      </ScrollView>
    </View>
  )
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
