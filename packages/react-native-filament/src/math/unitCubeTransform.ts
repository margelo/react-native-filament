import type { Aabb } from '../specs/types/Aabb'
import type { Mat4 } from '../specs/types/Mat4'

/** The transform that `TransformManager.transformToUnitCube` sets for `boundingBox`. Runs in any runtime. */
export function unitCubeTransform(boundingBox: Aabb): Mat4 {
  'worklet'
  const { center, halfExtent } = boundingBox
  const scale = 1 / Math.max(halfExtent[0], halfExtent[1], halfExtent[2])
  return [scale, 0, 0, 0, 0, scale, 0, 0, 0, 0, scale, 0, -center[0] * scale, -center[1] * scale, -center[2] * scale, 1]
}
