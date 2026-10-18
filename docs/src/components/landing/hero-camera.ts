/**
 * The hero camera. Landscape views fit the vertical field of view, portrait views the horizontal one.
 * hero-poster.webp and hero-poster.json depend on these values: run `bun run --cwd docs poster`
 * after changing them, the mesh or its material.
 */
export const HERO_CAMERA = {
  eye: [0, 0, 4.4] as [number, number, number],
  target: [0, -0.16, 0] as [number, number, number],
  landscapeFovDegrees: 30,
  portraitFovDegrees: 22,
}

/** The camera's focal length divided by half the canvas extent its field of view spans. */
export function focalScale(fovDegrees: number): number {
  return 1 / Math.tan((fovDegrees * Math.PI) / 360)
}
