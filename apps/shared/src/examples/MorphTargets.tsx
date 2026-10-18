import React, { useState } from 'react'
import { Button, ScrollView, StyleSheet, View } from 'react-native'
import { Camera, DefaultLight, FilamentScene, FilamentView, ModelRenderer, useFilamentContext, useModel, useRenderThreadCallback } from 'react-native-filament'

const avatar = require('../../assets/morphtargets.glb')

function Renderer() {
  const { renderableManager } = useFilamentContext()
  const model = useModel(avatar)
  const loaded = model.state === 'loaded' ? model.model : undefined

  const setMorphTarget = useRenderThreadCallback(
    (targetName: string, weight: number) => {
      'worklet'
      if (loaded == null) return
      for (const entity of loaded.entities) {
        if (!renderableManager.hasComponent(entity) || renderableManager.getMorphTargetCount(entity) === 0) continue
        const index = loaded.getMorphTargetNames(entity).indexOf(targetName)
        if (index >= 0) renderableManager.setMorphWeights(entity, [weight], index)
      }
    },
    [loaded, renderableManager]
  )

  return (
    <View style={styles.container}>
      <FilamentView style={styles.container}>
        <Camera cameraPosition={[0, 1, 4]} cameraTarget={[0, 1, 0]} />
        <DefaultLight />
        <ModelRenderer model={model} />
      </FilamentView>
      <ScrollView style={styles.buttons}>
        <Button title="Open Mouth" onPress={() => setMorphTarget('mouthOpen', 1)} />
        <Button title="Close Mouth" onPress={() => setMorphTarget('mouthOpen', 0)} />
      </ScrollView>
    </View>
  )
}

export function MorphTargets() {
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
