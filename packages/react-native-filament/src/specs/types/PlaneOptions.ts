export interface PlaneOptions {
  /** Size along X in meters. */
  width: number
  /** Size along Z in meters. */
  depth: number
  /** @default false */
  castShadows?: boolean
  /** @default true */
  receiveShadows?: boolean
}
