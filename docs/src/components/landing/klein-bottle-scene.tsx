'use client'

import { useEffect, useRef, useState } from 'react'
import type * as FilamentTypes from '@/lib/filament/filament'
import { withBasePath } from '@/lib/site-config'
import { createKleinBottleGlb } from './klein-bottle-glb'

type FilamentModule = typeof FilamentTypes & {
  init(assets: string[], onReady: () => void): void
  isReady?: boolean
}

declare global {
  interface Window {
    Filament?: FilamentModule
  }
}

const SCRIPT_URL = withBasePath('/filament/filament.js')
const IBL_URL = withBasePath('/filament/default_env_ibl.ktx')

let runtime: Promise<FilamentModule> | undefined

function loadFilament(): Promise<FilamentModule> {
  if (runtime == null) {
    runtime = new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = SCRIPT_URL
      script.async = true
      script.onerror = () => reject(new Error('Could not load filament.js'))
      script.onload = () => window.Filament!.init([IBL_URL], () => resolve(window.Filament!))
      document.head.appendChild(script)
    })
  }
  return runtime
}

type Mat4 = number[]

function multiply(a: Mat4, b: Mat4): Mat4 {
  const out = new Array<number>(16).fill(0)
  for (let column = 0; column < 4; column++) {
    for (let row = 0; row < 4; row++) {
      for (let k = 0; k < 4; k++) out[column * 4 + row]! += a[k * 4 + row]! * b[column * 4 + k]!
    }
  }
  return out
}

function rotationY(angle: number): Mat4 {
  const [c, s] = [Math.cos(angle), Math.sin(angle)]
  return [c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1]
}

function rotationX(angle: number): Mat4 {
  const [c, s] = [Math.cos(angle), Math.sin(angle)]
  return [1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1]
}

function rotationZ(angle: number): Mat4 {
  const [c, s] = [Math.cos(angle), Math.sin(angle)]
  return [c, s, 0, 0, -s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]
}

/** A Klein bottle rendered live with Filament for WebGL 2 on a transparent canvas. */
export function KleinBottleScene({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas == null) return
    let disposed = false
    let teardown = () => {}

    loadFilament().then((Filament) => {
      if (disposed) return
      const engine = Filament.Engine.create(canvas, { alpha: true } as unknown as { backend?: FilamentTypes.Backend })
      const scene = engine.createScene()
      const swapChain = engine.createSwapChain()
      const renderer = engine.createRenderer()
      const camera = engine.createCamera(Filament.EntityManager.get().create())
      const view = engine.createView()
      view.setCamera(camera)
      view.setScene(scene)
      view.setBlendMode(Filament.View$BlendMode.TRANSLUCENT)
      renderer.setClearOptions({ clearColor: [0, 0, 0, 0], clear: true })

      const ibl = engine.createIblFromKtx1(IBL_URL)
      ibl.setIntensity(65000)
      scene.setIndirectLight(ibl)

      const sun = Filament.EntityManager.get().create()
      Filament.LightManager.Builder(Filament.LightManager$Type.SUN)
        .color([1, 0.92, 0.84])
        .intensity(90000)
        .direction([-0.35, -0.55, -1])
        .sunAngularRadius(1.9)
        .build(engine, sun)
      scene.addEntity(sun)

      const loader = engine.createAssetLoader()
      const asset = loader.createAsset(createKleinBottleGlb())
      const resources = new Filament.gltfio$ResourceLoader(engine, true)
      resources.loadResources(asset)
      resources.delete()
      scene.addEntities(asset.getEntities())
      const transforms = engine.getTransformManager()
      const root = transforms.getInstance(asset.getRoot())

      camera.lookAt([0, 0, 4.4], [0, -0.16, 0], [0, 1, 0])

      const resize = () => {
        const ratio = Math.min(window.devicePixelRatio, 2)
        const width = Math.max(1, Math.round(canvas.clientWidth * ratio))
        const height = Math.max(1, Math.round(canvas.clientHeight * ratio))
        canvas.width = width
        canvas.height = height
        view.setViewport([0, 0, width, height])
        const portrait = width < height
        camera.setProjectionFov(portrait ? 22 : 30, width / height, 0.1, 50, portrait ? Filament.Camera$Fov.HORIZONTAL : Filament.Camera$Fov.VERTICAL)
      }
      resize()
      const observer = new ResizeObserver(resize)
      observer.observe(canvas)

      const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 }
      const onPointerMove = (event: PointerEvent) => {
        pointer.targetX = (event.clientX / window.innerWidth - 0.5) * 2
        pointer.targetY = (event.clientY / window.innerHeight - 0.5) * 2
      }
      window.addEventListener('pointermove', onPointerMove)

      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const start = performance.now()
      let frame = 0
      let shown = false
      const render = (now: number) => {
        const seconds = reduceMotion ? 0 : (now - start) / 1000
        pointer.x += (pointer.targetX - pointer.x) * 0.05
        pointer.y += (pointer.targetY - pointer.y) * 0.05
        const spin = rotationY(Math.sin(seconds * 0.3) * 0.85 + pointer.x * 0.5)
        const tilt = multiply(rotationX(0.18 + pointer.y * 0.25), rotationZ(Math.sin(seconds * 0.4) * 0.12))
        const lift = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, Math.sin(seconds * 0.8) * 0.03, 0, 1]
        transforms.setTransform(root, multiply(lift, multiply(tilt, spin)) as unknown as FilamentTypes.mat4)
        if (renderer.beginFrame(swapChain)) {
          renderer.renderView(view)
          renderer.endFrame()
          if (!shown) {
            shown = true
            setReady(true)
          }
        }
        engine.execute()
        frame = requestAnimationFrame(render)
      }
      frame = requestAnimationFrame(render)

      teardown = () => {
        cancelAnimationFrame(frame)
        observer.disconnect()
        window.removeEventListener('pointermove', onPointerMove)
        loader.destroyAsset(asset)
        loader.delete()
        Filament.Engine.destroy(engine)
      }
    })

    return () => {
      disposed = true
      teardown()
    }
  }, [])

  return <canvas ref={canvasRef} className={`${className ?? ''} transition-opacity duration-1000 ${ready ? 'opacity-100' : 'opacity-0'}`} aria-label="A Klein bottle rendered live with Filament" />
}
