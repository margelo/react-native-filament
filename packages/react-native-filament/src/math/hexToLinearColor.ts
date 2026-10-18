import type { Float4 } from '../specs/types/Float4'

function srgbToLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

/** Linear RGBA of an sRGB `#rrggbb` or `#rrggbbaa` color. */
export function hexToLinearColor(hex: string): Float4 {
  const match = /^#?([0-9a-f]{6})([0-9a-f]{2})?$/i.exec(hex)
  if (match == null) {
    throw new Error(`"${hex}" is not a #rrggbb or #rrggbbaa color.`)
  }
  const [red, green, blue] = [0, 2, 4].map((offset) => parseInt(match[1]!.slice(offset, offset + 2), 16) / 255)
  const alpha = match[2] == null ? 1 : parseInt(match[2], 16) / 255
  return [srgbToLinear(red!), srgbToLinear(green!), srgbToLinear(blue!), alpha]
}
