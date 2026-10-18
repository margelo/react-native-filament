import React, { useState } from 'react'
import { Button, StyleSheet, Text, View } from 'react-native'
import {
  Animator,
  Camera,
  DefaultLight,
  FilamentScene,
  FilamentView,
  ModelInstance,
  ModelRenderer,
  useFilamentContext,
  useModel,
  useRenderThreadEffect,
  type Model,
} from 'react-native-filament'

const dancer = require('../../assets/hiphopgirl.glb')

type Link = 'none' | 'follow' | 'attach'

const descriptions: Record<Link, string> = {
  none: 'The right dancer stands still.',
  follow: 'followSkeleton: the right dancer copies the left skeleton every frame.',
  attach: 'attachSkin: the right meshes, tinted red, are skinned by the left skeleton like clothing.',
}

function SkeletonLink({ model, link }: { model: Model; link: Link }) {
  const { renderableManager } = useFilamentContext()
  useRenderThreadEffect(() => {
    'worklet'
    const leader = model.getInstance(0)
    const follower = model.getInstance(1)
    if (link === 'follow') {
      follower.followSkeleton(leader)
      return () => follower.followSkeleton(undefined)
    }
    if (link === 'none') {
      follower.animator.updateBoneMatrices()
      return
    }
    const meshes = follower.entities.filter((entity) => renderableManager.hasComponent(entity))
    const tinted = meshes.flatMap((entity) =>
      Array.from({ length: renderableManager.getPrimitiveCount(entity) }, (_, primitive) => renderableManager.getMaterialInstanceAt(entity, primitive))
    )
    const colors = tinted.map((instance) => instance.getFloat4Parameter('baseColorFactor'))
    tinted.forEach((instance) => instance.setFloat4Parameter('baseColorFactor', [1, 0.25, 0.25, 1]))
    meshes.forEach((entity) => leader.attachSkin(0, entity))
    return () => {
      meshes.forEach((entity) => {
        leader.detachSkin(0, entity)
        follower.attachSkin(0, entity)
      })
      follower.animator.updateBoneMatrices()
      tinted.forEach((instance, index) => instance.setFloat4Parameter('baseColorFactor', colors[index]!))
    }
  }, [model, link, renderableManager])
  return null
}

function Renderer() {
  const model = useModel(dancer, { instanceCount: 2 })
  const [link, setLink] = useState<Link>('none')
  return (
    <View style={styles.container}>
      <FilamentView style={styles.container}>
        <Camera cameraPosition={[0, 1, 6.5]} cameraTarget={[0, 0.9, 0]} />
        <DefaultLight />
        <ModelRenderer model={model}>
          <ModelInstance index={0} translate={[-0.8, 0, 0]}>
            <Animator animationIndex={1} />
          </ModelInstance>
          <ModelInstance index={1} translate={[0.8, 0, 0]} />
        </ModelRenderer>
        {model.state === 'loaded' && <SkeletonLink model={model.model} link={link} />}
      </FilamentView>
      <Text style={styles.caption}>{descriptions[link]}</Text>
      <View style={styles.buttons}>
        {(['none', 'follow', 'attach'] as const).map((value) => (
          <Button key={value} title={value} disabled={value === link} onPress={() => setLink(value)} />
        ))}
      </View>
    </View>
  )
}

export function SkeletonSharing() {
  return (
    <FilamentScene>
      <Renderer />
    </FilamentScene>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  caption: { padding: 8, textAlign: 'center' },
  buttons: { flexDirection: 'row', justifyContent: 'space-around', paddingBottom: 16 },
})
