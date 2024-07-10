import React, { PropsWithChildren } from 'react'
import { TransformationProps, TransformContext } from './TransformContext'

type GroupProps = PropsWithChildren<TransformationProps>

export function Group({ children, position, multiplyWithCurrentTransform = false }: GroupProps): React.ReactElement {
  return <TransformContext.Provider value={{ position, multiplyWithCurrentTransform }}>{children}</TransformContext.Provider>
}
