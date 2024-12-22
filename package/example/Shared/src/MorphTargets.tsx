import * as React from 'react'
import { Button, ScrollView, StyleSheet, View } from 'react-native'
import {
  FilamentScene,
  FilamentView,
  Camera,
  Entity,
  DefaultLight,
  useFilamentContext,
  ModelRenderer,
  useModel,
} from 'react-native-filament'
import MorphModel from '~/assets/morphtargets.glb'
import { SafeAreaView } from 'react-native-safe-area-context'

function Renderer() {
  const { renderableManager } = useFilamentContext()
  const model = useModel(MorphModel)

  const setMorphTarget = React.useCallback(
    (targetName: string, weight: number) => {
      if (model.state !== 'loaded') return

      const renderables = model.asset.getRenderableEntities()
      renderables.forEach((entity: Entity) => {
        const morphCount = model.asset.getMorphTargetCountAt(entity)
        for (let i = 0; i < morphCount; i++) {
          const name = model.asset.getMorphTargetNameAt(entity, i)
          if (name === targetName) {
            renderableManager.setMorphWeights(entity, [weight], i)
            console.log(`Set ${targetName} to ${weight} at index ${i} on entity`)
          }
        }
      })
    },
    [model, renderableManager]
  )

  return (
    <View style={styles.container}>
      <FilamentView style={styles.filamentView}>
        <Camera cameraPosition={[0, 1, 4]} cameraTarget={[0, 1, 0]} />
        <DefaultLight />
        <ModelRenderer model={model} />
      </FilamentView>

      <ScrollView style={styles.btnContainer}>
        <Button title="Open Mouth" onPress={() => setMorphTarget('mouthOpen', 1.0)} />
        <Button title="Close Mouth" onPress={() => setMorphTarget('mouthOpen', 0.0)} />
      </ScrollView>
    </View>
  )
}

export function MorphTargets() {
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
