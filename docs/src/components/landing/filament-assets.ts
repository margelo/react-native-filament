import { withBasePath } from '@/lib/site-config'

/**
 * The hero's IBL is apps/shared/assets/default_env_ibl.ktx without its 256 px mip level: a quarter of
 * the size with nearly the same look. It is also shipped gzipped, because not every host compresses
 * .ktx files.
 */
export const FILAMENT_BOOT = {
  script: withBasePath('/filament/filament.js'),
  wasm: withBasePath('/filament/filament.wasm'),
  ibl: withBasePath('/filament/hero_ibl.ktx'),
  iblGzip: withBasePath('/filament/hero_ibl.ktx.gz'),
  poster: withBasePath('/filament/hero-poster.webp'),
}

export type FilamentBoot = typeof FILAMENT_BOOT
