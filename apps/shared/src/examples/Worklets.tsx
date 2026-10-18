import React, { useState } from 'react'
import { Button, StyleSheet, Text, View } from 'react-native'
import {
  Camera,
  DefaultLight,
  FilamentScene,
  FilamentView,
  ModelRenderer,
  quaternionFromEuler,
  useFilamentContext,
  useModel,
  useWorkletCallback,
  useWorkletEffect,
  useWorkletMemo,
  type Entity,
  type Mat4,
  type Model,
} from 'react-native-filament'

const coin = require('../../assets/coin.glb')
const tilt = 75 * (Math.PI / 180)

function describeTransform(transform: Mat4): string {
  const scale = Math.hypot(transform[0]!, transform[1]!, transform[2]!)
  return `scale ${scale.toFixed(2)}, translation [${transform
    .slice(12, 15)
    .map((value) => value.toFixed(2))
    .join(', ')}]`
}

function CoinControls({ model }: { model: Model }) {
  const { scene, transformManager, workletContext } = useFilamentContext()
  const [root] = useState(() => model.getInstance(0).rootEntity)
  const [size, setSize] = useState(1)
  const [spin, setSpin] = useState(0)
  const [transform, setTransform] = useState<string>()
  const [entityCount, setEntityCount] = useState<number>()

  const names = useWorkletMemo(() => {
    'worklet'
    return model.entities.flatMap((entity) => model.getEntityName(entity) ?? [])
  }, [model])

  useWorkletEffect(() => {
    'worklet'
    transformManager.setScale(root, [size, size, size])
    transformManager.setRotation(root, quaternionFromEuler([tilt, spin, 0]))
    return () => transformManager.setScale(root, [1, 1, 1])
  })

  const readTransform = useWorkletCallback((entity: Entity) => {
    'worklet'
    return transformManager.getTransform(entity)
  })

  const countEntities = () =>
    workletContext
      .runAsync(() => {
        'worklet'
        return scene.entityCount
      })
      .then(setEntityCount)

  return (
    <View style={styles.controls}>
      <Text style={styles.label}>useWorkletMemo: entities {names == null ? '…' : names.join(', ')}</Text>
      <Button title={`useWorkletEffect: scale to ${size === 1 ? '1.5' : '1'}`} onPress={() => setSize(size === 1 ? 1.5 : 1)} />
      <Button title="useWorkletEffect: spin 45°" onPress={() => setSpin(spin + Math.PI / 4)} />
      <Button
        title="useWorkletCallback: read transform"
        onPress={() => readTransform(root).then((matrix) => setTransform(describeTransform(matrix)))}
      />
      <Text style={styles.label}>{transform ?? 'Transform not read yet'}</Text>
      <Button title="workletContext.runAsync: count entities" onPress={countEntities} />
      <Text style={styles.label}>{entityCount == null ? 'Entities not counted yet' : `${entityCount} entities in the scene`}</Text>
    </View>
  )
}

function Renderer() {
  const model = useModel(coin)
  return (
    <View style={styles.container}>
      <FilamentView style={styles.filamentView} transparent>
        <Camera />
        <DefaultLight />
        <ModelRenderer model={model} />
      </FilamentView>
      {model.state === 'loaded' && <CoinControls model={model.model} />}
    </View>
  )
}

export function Worklets() {
  return (
    <FilamentScene>
      <Renderer />
    </FilamentScene>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  filamentView: { flex: 1, backgroundColor: 'lightblue' },
  controls: { padding: 12, gap: 4 },
  label: { textAlign: 'center' },
})
