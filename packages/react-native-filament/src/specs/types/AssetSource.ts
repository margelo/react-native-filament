import type { AssetUri } from './AssetUri'

/**
 * Where to read bytes from. An `ArrayBuffer` is copied once when the call is made, so the caller may
 * reuse it right away; a `{ uri }` is read natively and never enters JS.
 */
export type AssetSource = AssetUri | ArrayBuffer
