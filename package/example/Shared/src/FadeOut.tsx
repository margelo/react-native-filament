import * as React from 'react'
import { useEffect, useRef } from 'react'

import { Animated, Button, StyleSheet, View } from 'react-native'
import {
  Camera,
  DefaultLight,
  FilamentScene,
  FilamentView,
  Float3,
  getAssetFromModel,
  Model,
  ModelRenderer,
  useBuffer,
  useFilamentContext,
  useModel,
} from 'react-native-filament'
import { SafeAreaView } from 'react-native-safe-area-context'

function Renderer() {
  const model = useModel(require('~/assets/coin_with_alpha.glb'))
  const asset = getAssetFromModel(model)

  const { renderableManager } = useFilamentContext()

  const fadeOut = React.useCallback(() => {
    if (asset == null) {
      return
    }

    const anim = new Animated.Value(1)
    anim.addListener(({ value }) => {
      renderableManager.setAssetEntitiesOpacity(asset, value)
    })
    Animated.timing(anim, {
      toValue: 0,
      duration: 1000,
      useNativeDriver: false,
    }).start()
  }, [renderableManager, asset])

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FilamentView style={styles.filamentView}>
        <Camera />
        <DefaultLight />

        <ModelRenderer
          model={model}
          rotate={{
            angleInRadians: Math.PI / 2,
            axis: [1, 0, 0],
          }}
        />
      </FilamentView>
      <Button title="Fade out" onPress={fadeOut} />
    </SafeAreaView>
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
