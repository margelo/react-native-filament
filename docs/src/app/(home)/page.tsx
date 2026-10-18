import Link from 'next/link'
import { KleinBottleScene } from '@/components/landing/klein-bottle-scene'

export default function HomePage() {
  return (
    <main className="rnf-hero relative isolate flex flex-1 flex-col overflow-hidden">
      <div className="rnf-aurora" aria-hidden="true">
        <span className="rnf-aurora-blob rnf-aurora-amber" />
        <span className="rnf-aurora-blob rnf-aurora-violet" />
        <span className="rnf-aurora-blob rnf-aurora-cyan" />
      </div>
      <div className="rnf-floor" aria-hidden="true" />
      <div className="rnf-vignette" aria-hidden="true" />

      <h1 className="rnf-hero-wordmark" aria-label="react-native-filament">
        FILAMENT
      </h1>
      <KleinBottleScene className="absolute inset-0 h-full w-full" />

      <div className="relative z-10 mt-auto flex flex-col items-center gap-5 px-6 pb-16 text-center">
        <p className="max-w-xl text-balance text-base text-white/75 md:text-lg">
          Real-time, physically based 3D for React Native. Built on Google Filament and Nitro Modules, rendering on its own native thread.
        </p>
        <div className="flex flex-row gap-3">
          <Link href="/docs" className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black transition-transform hover:scale-[1.03]">
            Get Started
          </Link>
          <Link
            href="/api"
            className="rounded-full border border-white/15 bg-black/40 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur transition-transform hover:scale-[1.03]"
          >
            API Reference
          </Link>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 hidden justify-between px-6 pb-5 font-mono text-[11px] uppercase tracking-[0.18em] text-white/40 md:flex">
        <span>Klein bottle · rendered live with Filament 1.78 for WebGL</span>
        <span>npm i react-native-filament</span>
      </div>
    </main>
  )
}
