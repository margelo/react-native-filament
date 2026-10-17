/**
 * When an Engine renders its targets.
 * - `continuous`: every display refresh while a target is visible.
 * - `on-demand`: only after something changed, or after `requestFrame()`.
 */
export type RenderMode = 'continuous' | 'on-demand'
