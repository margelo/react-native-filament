import React, { PropsWithChildren } from 'react'
import { TransformationProps, TransformContext } from './TransformContext'

type GroupProps = PropsWithChildren<TransformationProps>

export function Group({ children, translate: position, multiplyWithCurrentTransform = false }: GroupProps): React.ReactElement {
  return <TransformContext.Provider value={{ translate: position, multiplyWithCurrentTransform }}>{children}</TransformContext.Provider>
}
