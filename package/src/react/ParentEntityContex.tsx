import React from 'react'
import { Entity } from '../types'

export const ParentEntityContext = React.createContext<Entity | null>(null)

export function useParentEntityContext() {
  const parentEntity = React.useContext(ParentEntityContext)
  if (parentEntity == null) {
    throw new Error('useParentEntityContext must be used inside a Model component')
  }
  return parentEntity
}
