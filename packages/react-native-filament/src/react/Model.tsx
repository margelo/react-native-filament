import React, { useMemo, type ReactNode } from 'react'
import type { AssetLike } from '../assets/AssetLike'
import type { FilamentModel } from '../hooks/FilamentModel'
import { useConfigureAssetShadow } from '../hooks/useConfigureAssetShadow'
import { useModel } from '../hooks/useModel'
import type { UseModelOptions } from '../hooks/UseModelOptions'
import type { Model as NativeModel } from '../specs/assets/Model.nitro'
import type { Entity } from '../specs/types/Entity'
import { ModelContext, type ModelContextValue } from './ModelContext'
import type { TransformationProps } from './TransformationProps'
import { usePressHandler } from './usePressHandler'
import { useTransformProps } from './useTransformProps'

export interface ModelRenderProps extends TransformationProps {
  /** Called when a press on the closest `FilamentView` hits a renderable of the model. */
  onPress?: (entity: Entity, modelEntities: Entity[]) => void
  /** @default the model's own setting */
  castShadow?: boolean
  /** @default the model's own setting */
  receiveShadow?: boolean
  /** `ModelInstance`, `Animator`, `EntitySelector` or `DebugBox` elements that configure the model. */
  children?: ReactNode
}

export interface ModelProps extends ModelRenderProps, UseModelOptions {
  source: AssetLike
}

export interface ModelRendererProps extends ModelRenderProps {
  /** A model from `useModel`. */
  model: FilamentModel
}

function LoadedModel({
  model,
  onPress,
  castShadow,
  receiveShadow,
  children,
  ...transformProps
}: ModelRenderProps & { model: NativeModel }) {
  const entities = useMemo(() => model.entities, [model])
  const context = useMemo<ModelContextValue>(
    () => ({
      model,
      instances: Array.from({ length: model.instanceCount }, (_, index) => model.getInstance(index)),
      rootEntity: model.rootEntity,
    }),
    [model]
  )
  useTransformProps(model.rootEntity, transformProps, model.boundingBox)
  useConfigureAssetShadow({ entities, castShadow, receiveShadow })
  usePressHandler(entities, onPress)
  return <ModelContext.Provider value={context}>{children}</ModelContext.Provider>
}

/** Renders a model loaded with `useModel`. */
export function ModelRenderer({ model, ...props }: ModelRendererProps) {
  if (model.state === 'loading') return null
  return <LoadedModel model={model.model} {...props} />
}

/**
 * Loads a glTF binary (`.glb`), shows it in the scene of the closest `FilamentScene` and disposes it
 * on unmount.
 */
export function Model({ source, instanceCount, addToScene, ...props }: ModelProps) {
  const model = useModel(source, { instanceCount, addToScene })
  return <ModelRenderer model={model} {...props} />
}

/** A loaded glTF model, as `useModel` and `engine.loadModel` return it. */
export type Model = NativeModel
