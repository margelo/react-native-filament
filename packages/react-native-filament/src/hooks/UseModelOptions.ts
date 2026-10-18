export interface UseModelOptions {
  /** Number of instances that share the model's resources. @default 1 */
  instanceCount?: number
  /** Adds every instance to the scene of the closest `FilamentScene`. @default true */
  addToScene?: boolean
}
