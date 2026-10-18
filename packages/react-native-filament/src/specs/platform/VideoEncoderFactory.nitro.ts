import type { HybridObject } from 'react-native-nitro-modules'
import type { VideoEncoderOptions } from '../types/VideoEncoderOptions'
import type { VideoEncoder } from './VideoEncoder.nitro'

/** Internal to react-native-filament. */
export interface VideoEncoderFactory extends HybridObject<{ ios: 'swift'; android: 'kotlin' }> {
  /** Resolves once the encoder accepts frames. */
  createEncoder(options: VideoEncoderOptions): Promise<VideoEncoder>
}
