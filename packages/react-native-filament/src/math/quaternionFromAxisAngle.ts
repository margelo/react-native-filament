import type { Float3 } from '../specs/types/Float3'
import type { Quaternion } from '../specs/types/Quaternion'

/** Rotation of `angleRadians` around `axis`, which does not need to be normalized. Runs in any runtime. */
export function quaternionFromAxisAngle(axis: Float3, angleRadians: number): Quaternion {
  'worklet'
  const length = Math.hypot(axis[0], axis[1], axis[2])
  if (length === 0) return [0, 0, 0, 1]
  const factor = Math.sin(angleRadians / 2) / length
  return [axis[0] * factor, axis[1] * factor, axis[2] * factor, Math.cos(angleRadians / 2)]
}
