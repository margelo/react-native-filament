import React from 'react'
import { PropsWithChildren, useMemo } from 'react'
import { FilamentInstance } from '../types'
import { ParentInstancesContext, useParentInstancesContext } from './ParentInstancesContext'
import { TransformationProps } from './TransformContext'
import { useApplyTransformations } from '../hooks/internal/useApplyTransformations'

type ModelInstanceProps = PropsWithChildren<
  TransformationProps & {
    index: number
  }
>

/**
 * You can render multiple instances of the same model. If you use a model multiple times this is recommended,
 * as it will only be loaded once into memory.
 * This component helps with applying configs to a specific instance of a model.
 *
 * @example
 * ```tsx
 * <Model source={require('model.glb')} instanceCount={2}>
 *   <ModelInstance index={0} scale={[1, 1, 1]} />
 *   <ModelInstance index={1} scale={[2, 2, 2]} />
 * </Model>
 * ```
 *
 */
export function ModelInstance({ index, ...restProps }: ModelInstanceProps) {
  const instances = useParentInstancesContext()
  const instance = instances[index]
  if (instance == null) {
    throw new Error(`The parent Model component has ${instances.length} instances. You tried to use index ${index}`)
  }

  return <ModelInstanceImpl instance={instance} {...restProps} />
}

type Props = PropsWithChildren<
  TransformationProps & {
    instance: FilamentInstance
  }
>

function ModelInstanceImpl({ instance, children, ...transformProps }: Props) {
  const rootEntity = useMemo(() => {
    return instance.getRoot()
  }, [instance])

  const instances = useMemo(() => [instance], [instance])

  useApplyTransformations({ transformProps, to: rootEntity })

  return <ParentInstancesContext.Provider value={instances}>{children}</ParentInstancesContext.Provider>
}
