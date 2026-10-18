import { preinit, preload } from 'react-dom'
import { FILAMENT_BOOT } from './filament-assets'
import { startFilament } from './start-filament'

/**
 * Downloads Filament with the HTML instead of after hydration: the wasm and the IBL are preloaded,
 * filament.js runs as soon as it arrives, and startFilament begins right away.
 */
export function FilamentPreload() {
  preload(FILAMENT_BOOT.poster, { as: 'image', fetchPriority: 'high' })
  preload(FILAMENT_BOOT.wasm, { as: 'fetch', crossOrigin: 'anonymous' })
  preload(FILAMENT_BOOT.iblGzip, { as: 'fetch', crossOrigin: 'anonymous' })
  preinit(FILAMENT_BOOT.script, { as: 'script' })
  return <script dangerouslySetInnerHTML={{ __html: `(${startFilament.toString()})(${JSON.stringify(FILAMENT_BOOT)});` }} />
}
