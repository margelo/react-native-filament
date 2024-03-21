import * as React from 'react'
import { useCallback, useEffect, useRef } from 'react'

import { StyleSheet, View } from 'react-native'
import {
  Filament,
  useEngine,
  Float3,
  useRenderCallback,
  useAsset,
  useWorld,
  useRigidBody,
  useStaticPlaneShape,
} from 'react-native-filament'
import { getPath } from './getPath'
import { useCoin } from './useCoin'

const penguModelPath = getPath('pengu.glb')
const indirectLightPath = getPath('default_env_ibl.ktx')
const pirateHatPath = getPath('pirate.glb')

// Camera config:
const cameraPosition: Float3 = [0, 0, 8]
const cameraTarget: Float3 = [0, 0, 0]
const cameraUp: Float3 = [0, 1, 0]
const focalLengthInMillimeters = 28
const near = 0.1
const far = 1000

export default function App() {
  const engine = useEngine()
  const world = useWorld(0, -9, 0)

  // Create an invisible floor:
  const floorShape = useStaticPlaneShape(0, 1, 0, 0)
  useRigidBody({
    mass: 0,
    origin: [0, -1.5, 0],
    shape: floorShape,
    world,
    id: 'floor',
  })

  const hasNotifiedTouchedFloor = useRef(false)

  const [coinABody, coinAEntity] = useCoin(
    engine,
    world,
    [0, 3, 0.0],
    useCallback((_thisBody, collidedWith) => {
      if (hasNotifiedTouchedFloor.current) {
        return
      }

      if (collidedWith.id !== 'floor') {
        return
      }

      hasNotifiedTouchedFloor.current = true
      console.log('Coin touched the floor!')
    }, [])
  )

  // const [coinB, coinBEntity] = useCoin(engine, world, [-1.3, 3.5, -0.4])
  // const [coinC, coinCEntity] = useCoin(engine, world, [0.1, 3.5, 0.7])

  const light = useAsset({ path: indirectLightPath })
  // const pengu = useModel({ engine: engine, path: penguModelPath })
  // const pirateHat = useModel({ engine: engine, path: pirateHatPath })
  // const pirateHatAnimator = useMemo(() => {
  //   if (pirateHat.state !== 'loaded' || pengu.state !== 'loaded') {
  //     return undefined
  //   }
  //   return pirateHat.asset.createAnimatorWithAnimationsFrom(pengu.asset)
  // }, [pengu, pirateHat])
  // const isPirateHatAdded = useRef(true) // assets are added by default to the scene

  useEffect(() => {
    if (asset.state !== 'loaded') return
    engine.transformToUnitCube(asset.asset)
    // Applies default opacity modes
    renderableManager.setAssetEntitiesOpacity(asset.asset, 1)
  }, [asset, engine, renderableManager])

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
      world.stepSimulation(1 / 60, 1, 1 / 60)
      if (coinAEntity != null) {
        engine.updateTransformByRigidBody(coinAEntity, coinABody)
      }
      // if (coinBEntity != null) {
      //   engine.updateTransformByRigidBody(coinBEntity, coinB)
      // }
      // if (coinCEntity != null) {
      //   engine.updateTransformByRigidBody(coinCEntity, coinC)
      // }
    }

    engine.getCamera().lookAt(cameraPosition, cameraTarget, cameraUp)

    // if (pengu.state !== 'loaded' || pirateHatAnimator == null) {
    //   return
    // }

    // // Update the animators to play the current animation
    // pengu.animator.applyAnimation(currentAnimationIndex.current, passedSeconds)
    // pirateHatAnimator.applyAnimation(currentAnimationIndex.current, passedSeconds)

    // // Eventually apply a cross fade
    // if (prevAnimationIndex.current != null) {
    //   if (prevAnimationStarted.current == null) {
    //     prevAnimationStarted.current = passedSeconds
    //   }
    //   animationInterpolation.current += passedSeconds - prevAnimationStarted.current
    //   const alpha = animationInterpolation.current / animationInterpolationTime

    //   // Blend animations using a cross fade
    //   pengu.animator.applyCrossFade(prevAnimationIndex.current, prevAnimationStarted.current!, alpha)
    //   pirateHatAnimator.applyCrossFade(prevAnimationIndex.current, prevAnimationStarted.current!, alpha)

    //   // Reset the prev animation once the transition is completed
    //   if (alpha >= 1) {
    //     prevAnimationIndex.current = undefined
    //     prevAnimationStarted.current = undefined
    //     animationInterpolation.current = 0
    //   }
    // }

    // pengu.animator.updateBoneMatrices()
    // pirateHatAnimator.updateBoneMatrices()
  })

  // const animations = useMemo(() => {
  //   if (pengu.state !== 'loaded') return []
  //   const count = pengu.animator.getAnimationCount()
  //   const names = []
  //   for (let i = 0; i < count; i++) {
  //     names.push(pengu.animator.getAnimationName(i))
  //   }
  //   return names
  // }, [pengu])

  return (
    <View style={styles.container}>
      <Filament style={styles.filamentView} engine={engine} />
      {/* <ScrollView style={styles.btnContainer}>
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
      </ScrollView> */}
    </View>
  )
}

function TestScreen() {
  return (
    <View style={{ flex: 1 }}>
      <Text>Test Screen</Text>
    </View>
  )
}

const Stack = createNativeStackNavigator()

function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Scene">
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen
          name="Scene"
          component={Scene}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen name="Test" component={TestScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}

export default App
