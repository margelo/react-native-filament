import React from 'react'
import { FilamentInstance } from '../types'

export const ParentInstancesContext = React.createContext<FilamentInstance[] | null>(null)

export function useParentInstancesContext() {
  const parentInstances = React.useContext(ParentInstancesContext)
  if (parentInstances == null) {
    throw new Error('useParentInstancesContext must be used inside a Model component')
  }
  return parentInstances
}
