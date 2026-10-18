import type { AssetUri } from '../specs/types/AssetUri'

/**
 * A `require()`d asset id, a URI string, an `{ uri }` object or raw bytes, as React components and
 * hooks accept them.
 */
export type AssetLike = number | string | AssetUri | ArrayBuffer
