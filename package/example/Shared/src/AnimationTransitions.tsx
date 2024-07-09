import { useNavigation } from '@react-navigation/native'
import * as React from 'react'
import { Button, ScrollView, StyleSheet, View } from 'react-native'
import { FilamentContext, FilamentView, Camera, Model, Animator, AnimationItem } from 'react-native-filament'
import { useSharedValue } from 'react-native-worklets-core'
import HipHopGirlGlb from '~/assets/hiphopgirl.glb'
import { DefaultLight } from './components/DefaultLight'
import { SafeAreaView } from 'react-native-safe-area-context'

const animationInterpolationTime = 5

function Renderer() {
  const currentAnimationIndex = useSharedValue(1)
  const [animations, setAnimations] = React.useState<AnimationItem[]>([])

  const navigation = useNavigation()

  // TODO: migrate onPress handler
  // const asset = getAssetFromModel(model)
  // const renderableEntities = useMemo(() => {
  //   if (asset == null) return []
  //   return asset.getRenderableEntities()
  // }, [asset])

  // const onTouchStart = useCallback(
  //   async (event: GestureResponderEvent) => {
  //     if (renderableEntities == null) return

  //     const { locationX, locationY } = event.nativeEvent
  //     const entity = await view.pickEntity(locationX, locationY)
  //     if (entity == null) {
  //       console.log('No entity was picked')
  //       return
  //     }
  //     console.log('Picked entity:', entity)

  //     // Check if the model was picked
  //     for (const renderableEntity of renderableEntities) {
  //       if (entity?.id === renderableEntity.id) {
  //         console.log('Model was picked!')
  //         return
  //       }
  //     }
  //   },
  //   [renderableEntities, view]
  // )

  return (
    <View style={styles.container}>
      <FilamentView style={styles.filamentView}>
        <Camera cameraPosition={[0, 1, 4]} cameraTarget={[0, 1, 0]} />
        <DefaultLight />

        <Model source={HipHopGirlGlb}>
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
      <FilamentContext key={count}>
        <Renderer />
      </FilamentContext>
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
