import React from 'react'
import { FilamentAsset } from '../types'

export const ParentModelAssetContext = React.createContext<FilamentAsset | null>(null)

export function useParentModelAssetContext() {
  const parentModel = React.useContext(ParentModelAssetContext)
  if (parentModel == null) {
    throw new Error('useParentModelAssetContext must be used inside a Model component')
  }
  return parentModel
}
