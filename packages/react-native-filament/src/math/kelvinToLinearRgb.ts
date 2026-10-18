import type { Float3 } from '../specs/types/Float3'

function srgbToLinear(channel: number): number {
  'worklet'
  const c = Math.max(0, Math.min(255, channel)) / 255
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

/** Linear RGB of a black body at `kelvin`, for `LightManager.setColor`. Runs in any runtime. */
export function kelvinToLinearRgb(kelvin: number): Float3 {
  'worklet'
  const t = kelvin / 100
  const red = t <= 66 ? 255 : 329.698727446 * (t - 60) ** -0.1332047592
  const green = t <= 66 ? (t < 19 ? 0 : 99.4708025861 * Math.log(t - 10) - 161.1195681661) : 288.1221695283 * (t - 60) ** -0.0755148492
  const blue = t >= 66 ? 255 : t <= 19 ? 0 : 138.5177312231 * Math.log(t - 10) - 305.0447927307
  return [srgbToLinear(red), srgbToLinear(green), srgbToLinear(blue)]
}
