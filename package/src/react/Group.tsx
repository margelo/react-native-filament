import React, { PropsWithChildren } from 'react'
import { Transformations, TransformContext } from './TransformContext'

type GroupProps = PropsWithChildren<Transformations>

export function Group({ children, position, multiplyWithCurrentTransform = false }: GroupProps): React.ReactElement {
  return <TransformContext.Provider value={{ position, multiplyWithCurrentTransform }}>{children}</TransformContext.Provider>
}
