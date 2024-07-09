import { Float3 } from '../types'

export function areFloat3Equal(a: Float3, b: Float3): boolean {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2]
}
