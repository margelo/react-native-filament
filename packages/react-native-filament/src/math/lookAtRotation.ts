import type { Float3 } from '../specs/types/Float3'
import type { Quaternion } from '../specs/types/Quaternion'

function normalize([x, y, z]: Float3): Float3 {
  'worklet'
  const length = Math.hypot(x, y, z) || 1
  return [x / length, y / length, z / length]
}

function cross(a: Float3, b: Float3): Float3 {
  'worklet'
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
}

/**
 * The rotation of a camera at `eye` looking at `target`, as `Camera.lookAt` computes it. `up` must not be
 * parallel to `eye − target`: unlike `Camera.lookAt`, this function does not pick another up vector, and
 * returns an invalid rotation. Runs in any runtime.
 */
export function lookAtRotation(eye: Float3, target: Float3, up: Float3): Quaternion {
  'worklet'
  const back = normalize([eye[0] - target[0], eye[1] - target[1], eye[2] - target[2]])
  const right = normalize(cross(up, back))
  const trueUp = cross(back, right)
  const [m00, m10, m20] = right
  const [m01, m11, m21] = trueUp
  const [m02, m12, m22] = back
  const trace = m00 + m11 + m22
  if (trace > 0) {
    const s = Math.sqrt(trace + 1) * 2
    return [(m21 - m12) / s, (m02 - m20) / s, (m10 - m01) / s, s / 4]
  }
  if (m00 > m11 && m00 > m22) {
    const s = Math.sqrt(1 + m00 - m11 - m22) * 2
    return [s / 4, (m01 + m10) / s, (m02 + m20) / s, (m21 - m12) / s]
  }
  if (m11 > m22) {
    const s = Math.sqrt(1 + m11 - m00 - m22) * 2
    return [(m01 + m10) / s, s / 4, (m12 + m21) / s, (m02 - m20) / s]
  }
  const s = Math.sqrt(1 + m22 - m00 - m11) * 2
  return [(m02 + m20) / s, (m12 + m21) / s, s / 4, (m10 - m01) / s]
}
