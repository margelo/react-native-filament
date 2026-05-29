import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { Camera, DefaultLight, FilamentScene, FilamentView, ModelRenderer, Skybox, useModel } from 'react-native-filament'

const INVALID_URL = { uri: 'https://example.com/non-existent-model.glb' }

function Renderer() {
  const model = useModel(INVALID_URL)

  if (model.state === 'error') {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Failed to load model</Text>
        <Text style={styles.errorMessage}>{model.error.message}</Text>
      </View>
    )
  }

  return (
    <FilamentView style={styles.filamentView} enableTransparentRendering={false}>
      <Camera />
      <DefaultLight />
      <Skybox colorInHex="#88defb" />
      <ModelRenderer model={model} transformToUnitCube />
    </FilamentView>
  )
}

export function ModelErrorHandling() {
  return (
    <FilamentScene>
      <Renderer />
    </FilamentScene>
  )
}

const styles = StyleSheet.create({
  filamentView: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#c0392b',
  },
  errorMessage: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
  },
})
