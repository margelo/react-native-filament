import * as React from 'react'
import { useEffect, useRef } from 'react'

import { Animated, Button, Platform, StyleSheet, View } from 'react-native'
import { Filament, useEngine, Float3, useRenderCallback, useAsset, useModel, useRenderableManager } from 'react-native-filament'

const indirectLightPath = Platform.select({
  android: 'custom/default_env_ibl.ktx',
  ios: 'default_env_ibl.ktx',
})!

const assetPath = Platform.select({
  android: 'custom/chair.glb',
  ios: 'chair.glb',
})!

// Camera config:
const cameraPosition: Float3 = [0, 0, 8]
const cameraTarget: Float3 = [0, 0, 0]
const cameraUp: Float3 = [0, 1, 0]
const focalLengthInMillimeters = 28
const near = 0.1
const far = 1000

export default function App() {
  const engine = useEngine()
  const renderableManager = useRenderableManager(engine)

  const light = useAsset({ path: indirectLightPath })
  const asset = useModel({ engine: engine, path: assetPath })

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

    engine.getCamera().lookAt(cameraPosition, cameraTarget, cameraUp)
  })

  return (
    <View style={styles.container}>
      <Filament style={styles.filamentView} engine={engine} />
      <Button
        title="Fade out"
        onPress={() => {
          const anim = new Animated.Value(1)
          anim.addListener(({ value }) => {
            renderableManager.setAssetEntitiesOpacity(asset.asset, value)
          })
          Animated.timing(anim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: false,
          }).start()
        }}
      />
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
