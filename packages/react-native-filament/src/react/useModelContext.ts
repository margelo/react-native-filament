import { useContext } from 'react'
import { ModelContext, type ModelContextValue } from './ModelContext'

export function useModelContext(component: string): ModelContextValue {
  const value = useContext(ModelContext)
  if (value == null) {
    throw new Error(`<${component}> must be used inside a <Model> or <ModelInstance>.`)
  }
  return value
}
