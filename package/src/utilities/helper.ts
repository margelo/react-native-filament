import { ISharedValue } from 'react-native-worklets-core'
import { Float3 } from '../types'

export const areFloat3Equal = (a: Float3, b?: Float3): boolean => {
  'worklet'
  return a[0] === b?.[0] && a[1] === b?.[1] && a[2] === b?.[2]
}

export const isWorkletSharedValue = (value: any): value is ISharedValue<any> => {
  'worklet'
  return typeof value === 'object' && value != null && 'addListener' in value && typeof value.addListener === 'function'
}
