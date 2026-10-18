import React, { useMemo } from 'react'
import {
  ModelRenderer,
  quaternionFromAxisAngle,
  useFilamentContext,
  useFrameCallback,
  useModel,
  useRenderThreadEffect,
  type FrameInfo,
  type Model as NativeModel,
} from 'react-native-filament'
import { BenchmarkScene } from './BenchmarkScene'

const coin = require('../../assets/coin.glb')
const COLUMNS = 20
const COUNT = 400
const SPACING = 0.45

function Rotations({ model }: { model: NativeModel }) {
  const { transformManager } = useFilamentContext()
  const roots = useMemo(() => Array.from({ length: COUNT }, (_, index) => model.getInstance(index).rootEntity), [model])

  useRenderThreadEffect(() => {
    'worklet'
    roots.forEach((entity, index) => {
      transformManager.setScale(entity, [0.2, 0.2, 0.2])
      transformManager.setTranslation(entity, [((index % COLUMNS) - 9.5) * SPACING, (Math.floor(index / COLUMNS) - 9.5) * SPACING, 0])
    })
  }, [roots, transformManager])

  useFrameCallback(
    ({ elapsedSeconds }: FrameInfo) => {
      'worklet'
      roots.forEach((entity, index) => {
        transformManager.setRotation(entity, quaternionFromAxisAngle([1, 0, 0], elapsedSeconds * 2 + index * 0.1))
      })
    },
    [roots, transformManager]
  )
  return null
}

function RotatingCoins() {
  const model = useModel(coin, { instanceCount: COUNT })
  return (
    <>
      <ModelRenderer model={model} />
      {model.state === 'loaded' && <Rotations model={model.model} />}
    </>
  )
}

/** 400 coin instances, each rotated by render-thread JS every frame. */
export function BenchRotations() {
  return (
    <BenchmarkScene scene="rotations-400" cameraPosition={[0, 0, 14]}>
      <RotatingCoins />
    </BenchmarkScene>
  )
}
