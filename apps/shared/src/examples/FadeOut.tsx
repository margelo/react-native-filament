import React from 'react'
import { Button, StyleSheet, View } from 'react-native'
import { useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated'
import {
  Camera,
  DefaultLight,
  FilamentScene,
  FilamentView,
  ModelRenderer,
  useFilamentContext,
  useModel,
  useRenderThreadEffect,
  useValueBinding,
  type Float3,
  type Model,
} from 'react-native-filament'

const coin = require('../../assets/coin_with_alpha.glb')
const tilt: Float3 = [75 * (Math.PI / 180), 0, 0]

function useModelOpacity(model: Model | undefined, opacity: SharedValue<number>) {
  const { engine, renderableManager } = useFilamentContext()
  const alpha = useValueBinding(opacity)
  useRenderThreadEffect(() => {
    'worklet'
    if (model == null || alpha == null) return
    const instances = model.entities
      .filter((entity) => renderableManager.hasComponent(entity))
      .flatMap((entity) =>
        Array.from({ length: renderableManager.getPrimitiveCount(entity) }, (_, primitive) => renderableManager.getMaterialInstanceAt(entity, primitive))
      )
      .filter((instance) => instance.hasParameter('baseColorFactor'))
    const colors = instances.map((instance) => instance.getFloat4Parameter('baseColorFactor'))
    let applied = 1
    const subscription = engine.addOnFrameListener(() => {
      if (alpha.value !== applied) {
        applied = alpha.value
        instances.forEach((instance, index) => {
          const [r, g, b, a] = colors[index]!
          instance.setFloat4Parameter('baseColorFactor', [r, g, b, a * applied])
        })
      }
      return false
    })
    return () => subscription.remove()
  }, [model, alpha, engine, renderableManager])
}

function Renderer() {
  const model = useModel(coin)
  const opacity = useSharedValue(1)
  useModelOpacity(model.state === 'loaded' ? model.model : undefined, opacity)

  const fadeOut = () => {
    opacity.value = 1
    opacity.value = withTiming(0, { duration: 1000 })
  }

  return (
    <View style={styles.container}>
      <FilamentView style={styles.filamentView} transparent>
        <Camera />
        <DefaultLight />
        <ModelRenderer model={model} rotate={tilt} />
      </FilamentView>
      <Button title="Fade out" onPress={fadeOut} />
    </View>
  )
}

export function FadeOut() {
  return (
    <FilamentScene>
      <Renderer />
    </FilamentScene>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  filamentView: { flex: 1, backgroundColor: 'lightblue' },
})
