import type { Float3 } from './Float3'

export interface LookAt {
  eye: Float3
  target: Float3
  up: Float3
}
