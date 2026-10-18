import type { AssetLike } from '../assets/AssetLike'
import type { Float4 } from '../specs/types/Float4'

/** A skybox of one color, as linear RGBA or an sRGB hex string, or from a KTX1 cubemap. */
export type SkyboxOptions = { color: Float4 } | { colorInHex: string } | { source: AssetLike }
