import type { Float3 } from '../specs/types/Float3'
import type { Mat4 } from '../specs/types/Mat4'
import type { Quaternion } from '../specs/types/Quaternion'

/**
 * The column-major matrix that scales, then rotates, then translates. Runs in any runtime.
 * @param rotation A unit quaternion. It is not normalized.
 * @param scale Defaults to `[1, 1, 1]`.
 */
export function composeTransform(translation: Float3, rotation: Quaternion, scale: Float3 = [1, 1, 1]): Mat4 {
  'worklet'
  const [x, y, z, w] = rotation
  const [sx, sy, sz] = scale
  return [
    (1 - 2 * (y * y + z * z)) * sx,
    2 * (x * y + z * w) * sx,
    2 * (x * z - y * w) * sx,
    0,
    2 * (x * y - z * w) * sy,
    (1 - 2 * (x * x + z * z)) * sy,
    2 * (y * z + x * w) * sy,
    0,
    2 * (x * z + y * w) * sz,
    2 * (y * z - x * w) * sz,
    (1 - 2 * (x * x + y * y)) * sz,
    0,
    translation[0],
    translation[1],
    translation[2],
    1,
  ]
}
