import React from 'react'
import type { ListenableValue } from '../bindings/ListenableValue'
import { useRenderThreadMemo } from '../hooks/useRenderThreadMemo'
import type { MaterialParameters, MaterialParametersItem } from './MaterialParameters'
import { MaterialParameter } from './MaterialParameter'
import { MorphWeights } from './MorphWeights'
import type { TextureMap } from './TextureMap'
import { TextureModifier } from './TextureModifier'
import type { TransformationProps } from './TransformationProps'
import { useFilamentScene } from './useFilamentScene'
import { useModelContext } from './useModelContext'
import { useTransformProps } from './useTransformProps'

interface SelectorModifiers extends Omit<TransformationProps, 'transformToUnitCube'> {
  /** Changes material parameters of the entity's primitives. */
  materialParameters?: MaterialParameters
  textureMap?: TextureMap
  /** Weights of the entity's morph targets, in target order. Accepts a SharedValue. */
  morphWeights?: number[] | ListenableValue<number[]>
}

export type EntitySelectorProps = SelectorModifiers & ({ byName: string } | { byIndex: number })

function materialItems(parameters: MaterialParameters | undefined): MaterialParametersItem[] {
  if (parameters == null) return []
  return Array.isArray(parameters) ? parameters : [parameters]
}

/**
 * Configures one entity of the parent `Model` or `ModelInstance`, found by glTF node name or by index
 * in the instance's entities. Transform props apply on top of the entity's own transform.
 */
export function EntitySelector({
  translate,
  rotate,
  scale,
  materialParameters,
  textureMap,
  morphWeights,
  ...selector
}: EntitySelectorProps) {
  const { model, instances } = useModelContext('EntitySelector')
  const { transformManager } = useFilamentScene()
  const instance = instances[0]!
  const byName = 'byName' in selector ? selector.byName : undefined
  const byIndex = 'byIndex' in selector ? selector.byIndex : undefined

  const selected = useRenderThreadMemo(() => {
    'worklet'
    const { entities } = instance
    const entity = byName != null ? entities.find((candidate) => model.getEntityName(candidate) === byName) : entities[byIndex!]
    if (entity == null) {
      throw new Error(`<EntitySelector> found no entity ${byName != null ? `named "${byName}"` : `at index ${byIndex}`}.`)
    }
    return { entity, original: transformManager.getTransform(entity) }
  }, [model, instance, byName, byIndex, transformManager])

  useTransformProps(selected?.entity, { translate, rotate, scale }, undefined, selected?.original)
  if (selected == null) return null
  return (
    <>
      {textureMap != null && <TextureModifier entity={selected.entity} {...textureMap} />}
      {morphWeights != null && <MorphWeights entity={selected.entity} weights={morphWeights} />}
      {materialItems(materialParameters).flatMap(({ index = 0, parameters }) =>
        Object.entries(parameters).map(([name, value]) =>
          value == null ? null : (
            <MaterialParameter key={`${index}:${name}`} entity={selected.entity} primitiveIndex={index} name={name} value={value} />
          )
        )
      )}
    </>
  )
}
