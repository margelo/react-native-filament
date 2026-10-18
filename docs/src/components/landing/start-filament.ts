import type * as FilamentTypes from '@/lib/filament/filament'
import type { FilamentBoot } from './filament-assets'

export type FilamentModule = typeof FilamentTypes & {
  init(assets: string[], onReady: () => void): void
}

export interface LoadedFilament {
  Filament: FilamentModule
  ibl: Uint8Array
}

declare global {
  interface Window {
    Filament?: FilamentModule
    __rnfFilament?: Promise<LoadedFilament>
  }
}

/**
 * Loads filament.js and the hero IBL once per page. FilamentPreload also inlines this function into
 * the HTML as a string, so it runs before hydration: it must not reference anything outside itself.
 */
export function startFilament(boot: FilamentBoot): Promise<LoadedFilament> {
  if (window.__rnfFilament != null) return window.__rnfFilament
  const readBytes = (url: string) =>
    fetch(url).then((response) => {
      if (!response.ok) throw new Error(`Could not load ${url}`)
      return response.arrayBuffer()
    })
  const ibl =
    typeof DecompressionStream === 'function'
      ? readBytes(boot.iblGzip).then((buffer) => {
          const bytes = new Uint8Array(buffer)
          if (bytes[0] !== 0x1f || bytes[1] !== 0x8b) return bytes
          const inflated = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))
          return new Response(inflated).arrayBuffer().then((raw) => new Uint8Array(raw))
        })
      : readBytes(boot.ibl).then((raw) => new Uint8Array(raw))
  const runtime = new Promise<FilamentModule>((resolve, reject) => {
    const init = () => window.Filament!.init([], () => resolve(window.Filament!))
    if (window.Filament != null && window.Filament.init != null) {
      init()
      return
    }
    let script = document.querySelector<HTMLScriptElement>(`script[src="${boot.script}"]`)
    if (script == null) {
      script = document.createElement('script')
      script.src = boot.script
      script.async = true
      document.head.appendChild(script)
    }
    script.addEventListener('load', init, { once: true })
    script.addEventListener('error', () => reject(new Error(`Could not load ${boot.script}`)), { once: true })
  })
  window.__rnfFilament = Promise.all([runtime, ibl]).then(([Filament, iblBytes]) => ({ Filament, ibl: iblBytes }))
  return window.__rnfFilament
}
