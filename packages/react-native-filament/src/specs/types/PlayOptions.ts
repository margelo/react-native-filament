export interface PlayOptions {
  /** @default true */
  loop?: boolean
  /** Playback rate; 1 is real time. @default 1 */
  speed?: number
  /** Blends from the previous animation over this many seconds. @default 0 */
  crossFadeSeconds?: number
}
