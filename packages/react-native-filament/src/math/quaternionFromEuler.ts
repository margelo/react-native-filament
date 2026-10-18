import type { Float3 } from '../specs/types/Float3'
import type { Quaternion } from '../specs/types/Quaternion'

/**
 * Rotation by `x`, then `y`, then `z` radians around the world axes, as the `rotate` transformation prop
 * applies it. Runs in any runtime.
 */
export function quaternionFromEuler(euler: Float3): Quaternion {
  'worklet'
  const [x, y, z] = euler
  const [cx, sx] = [Math.cos(x / 2), Math.sin(x / 2)]
  const [cy, sy] = [Math.cos(y / 2), Math.sin(y / 2)]
  const [cz, sz] = [Math.cos(z / 2), Math.sin(z / 2)]
  return [sx * cy * cz - cx * sy * sz, cx * sy * cz + sx * cy * sz, cx * cy * sz - sx * sy * cz, cx * cy * cz + sx * sy * sz]
}
