/**
 * A 4×4 matrix in column-major order, as Filament stores it: element `c * 4 + r` is row `r` of
 * column `c`, so the translation is elements 12, 13 and 14.
 */
export type Mat4 = [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
]
