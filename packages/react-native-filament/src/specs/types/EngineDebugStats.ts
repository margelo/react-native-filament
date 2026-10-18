export interface EngineDebugStats {
  /** How many resources of each kind still hold native objects, such as `{ Model: 1, Scene: 2 }`. */
  liveResources: Record<string, number>
}
