type Float3 = [number, number, number]

// Converts sRGB to linear light
function toLinear(c: number): number {
  'worklet'
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

// Converts a Kelvin temp to linear sRGB color
export default function makeKelvinLinearRGB(kelvin: number): Float3[] {
  'worklet'

  const temp = kelvin / 100
  let red: number, green: number, blue: number

  if (temp <= 66) {
    red = 255
    green = temp < 19 ? 0 : 99.4708025861 * Math.log(temp - 10) - 161.1195681661
  } else {
    red = 329.698727446 * (temp - 60) ** -0.1332047592
    green = 288.1221695283 * (temp - 60) ** -0.0755148492
  }

  if (temp >= 66) {
    blue = 255
  } else if (temp <= 19) {
    blue = 0
  } else {
    blue = 138.5177312231 * Math.log(temp - 10) - 305.0447927307
  }

  const r = toLinear(Math.max(0, Math.min(255, red)) / 255)
  const g = toLinear(Math.max(0, Math.min(255, green)) / 255)
  const b = toLinear(Math.max(0, Math.min(255, blue)) / 255)

  return [r, g, b]
}
