import React, { useMemo, type ReactNode } from 'react'
import { ModelContext, type ModelContextValue } from './ModelContext'
import type { TransformationProps } from './TransformationProps'
import { useModelContext } from './useModelContext'
import { useTransformProps } from './useTransformProps'
import type { ModelInstance as NativeModelInstance } from '../specs/assets/ModelInstance.nitro'

export interface ModelInstanceProps extends TransformationProps {
  /** Index of the instance in the parent `Model`. */
  index: number
  children?: ReactNode
}

/**
 * Configures one instance of the parent `Model`, which shares its resources with the others.
 *
 * @example
 * ```tsx
 * <Model source={require('./car.glb')} instanceCount={2}>
 *   <ModelInstance index={0} translate={[-1, 0, 0]} />
 *   <ModelInstance index={1} translate={[1, 0, 0]} />
 * </Model>
 * ```
 */
export function ModelInstance({ index, children, ...transformProps }: ModelInstanceProps) {
  const { model, instances } = useModelContext('ModelInstance')
  const instance = instances[index]
  if (instance == null) {
    throw new Error(`<ModelInstance index={${index}}> is out of range: the parent <Model> has ${instances.length} instances.`)
  }
  useTransformProps(instance.rootEntity, transformProps, model.boundingBox)
  const context = useMemo<ModelContextValue>(() => ({ model, instances: [instance], rootEntity: instance.rootEntity }), [model, instance])
  return <ModelContext.Provider value={context}>{children}</ModelContext.Provider>
}

/** One instance of a loaded model. */
export type ModelInstance = NativeModelInstance
