/**
 * Scale an asset from 0 to its original size.
 */

import * as React from 'react'
import { useMemo } from 'react'

import { Animated, Button, StyleSheet } from 'react-native'
import { FilamentView, useModel, Mat4, FilamentScene, Camera, DefaultLight, useFilamentContext, ModelRenderer } from 'react-native-filament'
import { SafeAreaView } from 'react-native-safe-area-context'
import Coin from '~/assets/coin.glb'

function Renderer() {
  const model = useModel(Coin)
  const rootEntity = model.state === 'loaded' ? model.rootEntity : null

  const { transformManager } = useFilamentContext()
  // Capture the original transform to scale from
  const originalTransform = useMemo<Mat4 | null>(() => {
    if (rootEntity == null) return null
    return transformManager.getTransform(rootEntity)
  }, [rootEntity, transformManager])

  const onScale = () => {
    if (rootEntity == null || originalTransform == null) return
    const animatedScale = new Animated.Value(0)

    const transform = originalTransform
    animatedScale.addListener(({ value }) => {
      transformManager.openLocalTransformTransaction()
      const scaledTransform = transform.scaling([value, value, value]).rotate(75 * (Math.PI / 180), [1, 0, 0])
      transformManager.setTransform(rootEntity, scaledTransform)
      transformManager.commitLocalTransformTransaction()
    })

    Animated.spring(animatedScale, {
      toValue: 1,
      mass: 3,
      stiffness: 1000,
      damping: 500,
      useNativeDriver: false,
    }).start()
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FilamentView style={styles.filamentView}>
        <Camera />
        <DefaultLight />

        <ModelRenderer model={model} scale={[0, 0, 0]} />
      </FilamentView>
      <Button title="Scale" onPress={onScale} />
    </SafeAreaView>
  )
}

export function ScaleEffect() {
  return (
    <FilamentScene>
      <Renderer />
    </FilamentScene>
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
})
