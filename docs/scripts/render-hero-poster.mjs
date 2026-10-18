/**
 * Renders public/filament/hero-poster.webp and src/components/landing/hero-poster.json from a running
 * docs server: the first frame of the hero's Klein bottle on a transparent background, and its box in
 * units of the camera's focal length. Needs Google Chrome.
 *
 *   bun run --cwd docs poster [url]   (default: http://localhost:3000/react-native-filament/)
 */
import { spawn } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const url = process.argv[2] ?? 'http://localhost:3000/react-native-filament/'
const docs = join(dirname(fileURLToPath(import.meta.url)), '..')
const chrome = process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const width = 1440
const height = 900
const deviceScale = 2
const outputScale = 0.6
const quality = 0.78
const port = 9339
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const browser = spawn(chrome, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), 'rnf-poster-'))}`, `--window-size=${width},${height}`, '--hide-scrollbars', '--no-first-run'], { stdio: 'ignore' })
for (let attempt = 0; attempt < 50; attempt++) {
  try {
    await fetch(`http://127.0.0.1:${port}/json/version`)
    break
  } catch {
    await sleep(200)
  }
}
const target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json()
const socket = new WebSocket(target.webSocketDebuggerUrl)
await new Promise((resolve) => socket.addEventListener('open', resolve))
let nextId = 0
const pending = new Map()
socket.addEventListener('message', (event) => {
  const message = JSON.parse(event.data)
  if (message.id != null && pending.has(message.id)) {
    pending.get(message.id)(message)
    pending.delete(message.id)
  }
})
const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const id = ++nextId
    pending.set(id, (message) => (message.error ? reject(new Error(`${method}: ${message.error.message}`)) : resolve(message.result)))
    socket.send(JSON.stringify({ id, method, params }))
  })
const evaluate = async (expression) => {
  const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
  if (result.exceptionDetails != null) throw new Error(result.exceptionDetails.text)
  return result.result.value
}

try {
  await send('Page.enable')
  await send('Runtime.enable')
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: deviceScale, mobile: false })
  // Reduced motion holds the bottle in its first-frame pose.
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] })
  await send('Page.navigate', { url })
  let ready = false
  for (let attempt = 0; attempt < 400 && !ready; attempt++) {
    await sleep(50)
    ready = await evaluate("!!document.querySelector('canvas')?.className.includes('opacity-100')").catch(() => false)
  }
  if (!ready) throw new Error(`The hero never rendered at ${url}`)
  await sleep(500)
  const canvas = await evaluate("(() => { const r = document.querySelector('canvas').getBoundingClientRect(); return { left: r.left, top: r.top, width: r.width, height: r.height } })()")
  await evaluate("(() => { const style = document.createElement('style'); style.textContent = 'html, body { background: transparent !important } body * { visibility: hidden !important } canvas { visibility: visible !important }'; document.head.appendChild(style) })()")
  await send('Emulation.setDefaultBackgroundColorOverride', { color: { r: 0, g: 0, b: 0, a: 0 } })
  await sleep(300)
  const screenshot = await send('Page.captureScreenshot', { format: 'png' })
  const poster = await evaluate(`(async () => {
    const image = new Image()
    image.src = 'data:image/png;base64,${screenshot.data}'
    await image.decode()
    const full = document.createElement('canvas')
    full.width = image.width
    full.height = image.height
    const context = full.getContext('2d')
    context.drawImage(image, 0, 0)
    const { data } = context.getImageData(0, 0, full.width, full.height)
    let minX = full.width, minY = full.height, maxX = -1, maxY = -1
    for (let y = 0; y < full.height; y++) {
      for (let x = 0; x < full.width; x++) {
        if (data[(y * full.width + x) * 4 + 3] > 2) {
          minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y)
        }
      }
    }
    const pad = 4
    minX = Math.max(0, minX - pad); minY = Math.max(0, minY - pad)
    maxX = Math.min(full.width - 1, maxX + pad); maxY = Math.min(full.height - 1, maxY + pad)
    const out = document.createElement('canvas')
    out.width = Math.round((maxX - minX + 1) * ${outputScale})
    out.height = Math.round((maxY - minY + 1) * ${outputScale})
    const outContext = out.getContext('2d')
    outContext.imageSmoothingQuality = 'high'
    outContext.drawImage(full, minX, minY, maxX - minX + 1, maxY - minY + 1, 0, 0, out.width, out.height)
    return { minX, minY, maxX, maxY, imageWidth: out.width, imageHeight: out.height, webp: out.toDataURL('image/webp', ${quality}) }
  })()`)
  const css = {
    left: poster.minX / deviceScale - canvas.left,
    top: poster.minY / deviceScale - canvas.top,
    width: (poster.maxX - poster.minX + 1) / deviceScale,
    height: (poster.maxY - poster.minY + 1) / deviceScale,
  }
  const { HERO_CAMERA, focalScale } = await import('../src/components/landing/hero-camera.ts').catch(() => ({}))
  const fov = HERO_CAMERA?.landscapeFovDegrees ?? 30
  const focal = (canvas.height / 2) * (focalScale ? focalScale(fov) : 1 / Math.tan((fov * Math.PI) / 360))
  const round = (value) => Math.round(value * 100000) / 100000
  const geometry = {
    x: round((css.left - canvas.width / 2) / focal),
    y: round((css.top - canvas.height / 2) / focal),
    width: round(css.width / focal),
    height: round(css.height / focal),
    imageWidth: poster.imageWidth,
    imageHeight: poster.imageHeight,
  }
  const webp = Buffer.from(poster.webp.split(',')[1], 'base64')
  writeFileSync(join(docs, 'public/filament/hero-poster.webp'), webp)
  writeFileSync(join(docs, 'src/components/landing/hero-poster.json'), `${JSON.stringify(geometry, null, 2)}\n`)
  console.log(`hero-poster.webp ${poster.imageWidth}x${poster.imageHeight}, ${webp.length} bytes`, geometry)
} finally {
  socket.close()
  browser.kill()
}
