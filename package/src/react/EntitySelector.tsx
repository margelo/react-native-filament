import { useContext, useMemo } from 'react'
import { ParentInstancesContext } from './ParentInstancesContext'
import { Entity, extractTransformationProps, TextureFlags, TransformationProps } from '../types'
import { useFilamentContext } from '../hooks/useFilamentContext'
import React from 'react'
import { useApplyTransformations } from '../hooks/internal/useApplyTransformations'
import { FilamentBuffer } from '../native/FilamentBuffer'
import { useWorkletEffect } from '../hooks/useWorkletEffect'

export type SelectorProps =
  | {
      byName: string
    }
  | {
      byIndex: number
    }

export type TextureMap = {
  materialName: string
  textureSource: FilamentBuffer
  textureFlags?: TextureFlags
}

export type ModifierProps = TransformationProps & {
  textureMap?: TextureMap
}

export type EntitySelectorProps = SelectorProps & ModifierProps

export function EntitySelector(props: EntitySelectorProps) {
  const parentInstances = useContext(ParentInstancesContext)
  const parentInstance = parentInstances?.[0]

  const byName = 'byName' in props ? props.byName : undefined
  const byIndex = 'byIndex' in props ? props.byIndex : undefined

  const { nameComponentManager } = useFilamentContext()
  const entity = useMemo(() => {
    if (parentInstance == null) return

    const entities = parentInstance.getEntities()

    if (byName != null) {
      // TODO: can be optimized by using it from asset, or https://github.com/google/filament/discussions/7980
      return entities.find((e) => nameComponentManager.getEntityName(e) === byName)
    } else if (byIndex != null) {
      if (byIndex >= entities.length) {
        throw new Error('<EntitySelector>: byIndex is out of bounds. Instance only has ' + entities.length + ' entities')
      }

      return entities[byIndex]
    } else {
      return null
    }
  }, [byIndex, byName, nameComponentManager, parentInstance])

  if (parentInstance == null) {
    throw new Error('<EntitySelector> must be used inside a <Model> or <ModelInstance> component')
  }

  if (byName != null && byIndex != null) {
    throw new Error('<EntitySelector>: Only one of byName or byIndex can be provided')
  }

  if (entity == null) {
    throw new Error(`<EntitySelector>: Could not find entity by ${byName != null ? 'name' : 'index'} "${byName ?? byIndex}"`)
  }

  return <EntitySelectorImpl entity={entity} {...props} />
}

type ImplProps = {
  entity: Entity
} & ModifierProps

/**
 * @private
 */
function EntitySelectorImpl(props: ImplProps) {
  const [transformProps, { entity, textureMap }] = extractTransformationProps(props)
  useApplyTransformations({ to: entity, transformProps })

  return <>{textureMap != null && <TextureModifier entity={entity} {...textureMap} />}</>
}

type TextureModifierProps = TextureMap & {
  entity: Entity
}

/**
 * @private
 */
function TextureModifier({ entity, textureSource, materialName, textureFlags = 'sRGB' }: TextureModifierProps) {
  const { renderableManager } = useFilamentContext()
  useWorkletEffect(() => {
    'worklet'

    renderableManager.changeMaterialTextureMap(entity, materialName, textureSource, textureFlags)
  })

  return null
}
