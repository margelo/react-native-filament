import { useContext, useEffect, useState } from 'react'
import { bindSharedValue } from '../bindings/bindSharedValue'
import { isListenableValue } from '../bindings/isListenableValue'
import type { ListenableValue } from '../bindings/ListenableValue'
import { identityTransform } from '../math/identityTransform'
import { quaternionFromEuler } from '../math/quaternionFromEuler'
import { unitCubeTransform } from '../math/unitCubeTransform'
import type { TransformBinding } from '../specs/control/TransformBinding.nitro'
import type { Aabb } from '../specs/types/Aabb'
import type { Entity } from '../specs/types/Entity'
import type { Float3 } from '../specs/types/Float3'
import type { Mat4 } from '../specs/types/Mat4'
import { FilamentSceneContext } from './FilamentSceneContext'
import type { TransformationProps } from './TransformationProps'
import { useRenderCommit } from './useRenderCommit'
import { useReportFailure } from './useReportFailure'

const origin: Float3 = [0, 0, 0]
const unitScale: Float3 = [1, 1, 1]

type Float3Writer = (binding: TransformBinding, value: Float3) => void

function writeTranslation(binding: TransformBinding, [x, y, z]: Float3): void {
  'worklet'
  binding.setTranslation(x, y, z)
}

function writeRotation(binding: TransformBinding, euler: Float3): void {
  'worklet'
  const [x, y, z, w] = quaternionFromEuler(euler)
  binding.setRotation(x, y, z, w)
}

function writeScale(binding: TransformBinding, [x, y, z]: Float3): void {
  'worklet'
  binding.setScale(x, y, z)
}

function currentFloat3(value: Float3 | ListenableValue<Float3> | undefined, fallback: Float3): Float3 {
  if (value == null) return fallback
  return isListenableValue(value) ? value.value : value
}

function useFloat3(
  binding: TransformBinding | undefined,
  value: Float3 | ListenableValue<Float3> | undefined,
  fallback: Float3,
  write: Float3Writer
): void {
  const shared = value != null && isListenableValue(value) ? value : undefined
  const fixed = shared == null ? ((value as Float3 | undefined) ?? fallback) : undefined
  useEffect(() => {
    if (binding != null && fixed != null) write(binding, fixed)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [binding, fixed?.[0], fixed?.[1], fixed?.[2]])
  useEffect(() => {
    if (binding == null || shared == null) return
    return bindSharedValue(shared, (next) => {
      'worklet'
      write(binding, next)
    })
  }, [binding, shared, write])
}

/**
 * Applies transformation props to `entity` through a `TransformBinding`, and gives the entity back
 * its `original` transform when the props are removed or the component unmounts.
 */
export function useTransformProps(
  entity: Entity | undefined,
  props: TransformationProps,
  boundingBox?: Aabb,
  original: Mat4 = identityTransform
): void {
  const commit = useRenderCommit()
  const scene = useContext(FilamentSceneContext)
  const fail = useReportFailure()
  const { translate, rotate, scale, transformToUnitCube = false } = props
  const isTransformed = translate != null || rotate != null || scale != null || transformToUnitCube
  const base = transformToUnitCube && boundingBox != null ? unitCubeTransform(boundingBox) : original
  const [binding, setBinding] = useState<TransformBinding>()

  useEffect(() => {
    if (entity == null || !isTransformed || scene == null) return
    const { engine, transformManager } = scene
    const translation = currentFloat3(translate, origin)
    const rotation = quaternionFromEuler(currentFloat3(rotate, origin))
    const scaling = currentFloat3(scale, unitScale)
    let active = true
    const created = commit.run(() => {
      'worklet'
      const bound = engine.createTransformBinding(entity)
      bound.setBase(base)
      bound.setTranslation(translation[0], translation[1], translation[2])
      bound.setRotation(rotation[0], rotation[1], rotation[2], rotation[3])
      bound.setScale(scaling[0], scaling[1], scaling[2])
      return bound
    })
    created.then(
      (bound) => {
        if (active) setBinding(bound)
      },
      (error: unknown) => {
        if (active) fail(error)
      }
    )
    return () => {
      active = false
      setBinding(undefined)
      commit.post(() => {
        'worklet'
        transformManager.setTransform(entity, original)
      })
      created.then(
        (bound) => bound.dispose(),
        () => undefined
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commit, scene, entity, isTransformed])

  useEffect(() => {
    binding?.setBase(base)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [binding, ...base])
  useFloat3(binding, translate, origin, writeTranslation)
  useFloat3(binding, rotate, origin, writeRotation)
  useFloat3(binding, scale, unitScale, writeScale)
}
