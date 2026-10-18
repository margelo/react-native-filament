/**
 * Runs the benchmark scenes of the installed example app and writes one JSON result file.
 *
 *   bun benchmarks/run.ts --platform android --version v2 [--backend vulkan] [--runs 2] [--warmup 10] [--measure 20]
 *
 * Each run cold-launches a scene through its `rnfexample://` link, waits for the warm-up, then measures
 * for `--measure` seconds: process CPU from the start and end of the window, memory at its end, and the
 * render, JS and UI frame rates the app logs once per second as `RNFBENCH` lines.
 */
import { execSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'

const SCENES = ['benchstatic', 'benchstaticondemand', 'benchanimated', 'benchinstances', 'benchrotations', 'benchphysics']
const ANDROID_PACKAGE = 'com.appexamplefabric'
const IOS_BUNDLE = 'org.reactjs.native.example.AppExampleFabric'
const SIMULATOR = process.env.RNF_SIMULATOR ?? '6D0F092F-FC0C-4599-8333-1AB93432E09B'
const ADB = `${process.env.HOME}/Library/Android/sdk/platform-tools/adb`

interface Sample {
  scene: string
  t: number
  render: number
  js: number
  ui: number
}

interface RunResult {
  scene: string
  run: number
  crashed: boolean
  cpuPercent?: number
  threads?: Record<string, number>
  memoryMb?: Record<string, number>
  samples: Sample[]
}

const args = new Map<string, string>()
process.argv.slice(2).forEach((arg, index, all) => {
  if (arg.startsWith('--')) args.set(arg.slice(2), all[index + 1] ?? '')
})
const platform = args.get('platform') as 'android' | 'ios'
const version = args.get('version') ?? 'v2'
const backend = args.get('backend')
const query = backend == null ? '' : `?backend=${backend}`
const runs = Number(args.get('runs') ?? 2)
const warmupSeconds = Number(args.get('warmup') ?? 10)
const measureSeconds = Number(args.get('measure') ?? 20)
const scenes = args.get('scenes')?.split(',') ?? SCENES

function sh(command: string): string {
  return execSync(command, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }).trim()
}

function shOrEmpty(command: string): string {
  try {
    return sh(command)
  } catch {
    return ''
  }
}

const sleep = (seconds: number) => Bun.sleep(seconds * 1000)

function parseSamples(lines: string[], from: number, to: number): Sample[] {
  return lines
    .map((line) => line.slice(line.indexOf('RNFBENCH ') + 'RNFBENCH '.length))
    .filter((json) => json.startsWith('{'))
    .map((json) => JSON.parse(json) as Sample)
    .filter((sample) => sample.t >= from && sample.t <= to)
}

function androidThreadTicks(pid: string): Map<string, number> {
  const ticks = new Map<string, number>()
  const output = shOrEmpty(`${ADB} shell 'for t in /proc/${pid}/task/*; do cat $t/stat 2>/dev/null; echo; done'`)
  for (const line of output.split('\n')) {
    const match = /^\d+ \((.*)\) \S+ (.*)$/.exec(line.trim())
    if (match == null) continue
    const fields = match[2]!.split(' ')
    const name = match[1]!
    ticks.set(name, (ticks.get(name) ?? 0) + Number(fields[11]) + Number(fields[12]))
  }
  return ticks
}

function androidMemory(pid: string): Record<string, number> {
  const meminfo = shOrEmpty(`${ADB} shell dumpsys meminfo ${pid}`)
  const value = (pattern: RegExp) => Number(pattern.exec(meminfo)?.[1] ?? NaN) / 1024
  return {
    totalPss: value(/TOTAL PSS:\s+(\d+)/),
    nativeHeap: value(/Native Heap:\s+(\d+)/),
    graphics: value(/Graphics:\s+(\d+)/),
  }
}

function androidAppInForeground(): boolean {
  return shOrEmpty(`${ADB} shell dumpsys window | grep mCurrentFocus`).includes(`${ANDROID_PACKAGE}/`)
}

async function runAndroid(scene: string, run: number): Promise<RunResult> {
  sh(`${ADB} shell input keyevent KEYCODE_WAKEUP`)
  sh(`${ADB} shell am force-stop ${ANDROID_PACKAGE}`)
  sh(`${ADB} logcat -c`)
  sh(`${ADB} shell am start -W -a android.intent.action.VIEW -d "'rnfexample://${scene}${query}'" ${ANDROID_PACKAGE}`)
  await sleep(warmupSeconds)
  const pid = shOrEmpty(`${ADB} shell pidof ${ANDROID_PACKAGE}`)
  if (pid === '') return { scene, run, crashed: true, samples: [] }
  const startTicks = androidThreadTicks(pid)
  const from = Date.now()
  await sleep(measureSeconds)
  const to = Date.now()
  if (shOrEmpty(`${ADB} shell pidof ${ANDROID_PACKAGE}`) !== pid || !androidAppInForeground())
    return { scene, run, crashed: true, samples: [] }
  const endTicks = androidThreadTicks(pid)
  const memoryMb = androidMemory(pid)
  const elapsed = (to - from) / 1000
  const threads: Record<string, number> = {}
  let total = 0
  for (const [name, end] of endTicks) {
    const percent = ((end - (startTicks.get(name) ?? 0)) / 100 / elapsed) * 100
    total += percent
    if (percent >= 1) threads[name] = Math.round(percent * 10) / 10
  }
  const lines = sh(`${ADB} logcat -d -s ReactNativeJS:I`)
    .split('\n')
    .filter((line) => line.includes('RNFBENCH'))
  return { scene, run, crashed: false, cpuPercent: total, threads, memoryMb, samples: parseSamples(lines, from, to) }
}

function iosCpuSeconds(pid: string): number {
  const time = sh(`ps -o time= -p ${pid}`)
  const parts = time.split(':').map(Number)
  return parts.reduce((seconds, part) => seconds * 60 + part, 0)
}

function iosMemory(pid: string): Record<string, number> {
  const footprint = shOrEmpty(`footprint ${pid}`)
  const match = /phys_footprint:\s+([\d.]+)\s*(KB|MB|GB)/.exec(footprint)
  const scale = { KB: 1 / 1024, MB: 1, GB: 1024 } as const
  return {
    footprint: match == null ? NaN : Number(match[1]) * scale[match[2] as keyof typeof scale],
    rss: Number(sh(`ps -o rss= -p ${pid}`)) / 1024,
  }
}

async function runIos(scene: string, run: number): Promise<RunResult> {
  shOrEmpty(`xcrun simctl terminate ${SIMULATOR} ${IOS_BUNDLE}`)
  sh(`xcrun simctl openurl ${SIMULATOR} 'rnfexample://${scene}${query}'`)
  await sleep(warmupSeconds)
  const pid = shOrEmpty(`pgrep -f "AppExampleFabric.app/AppExampleFabric$"`).split('\n')[0] ?? ''
  if (pid === '') return { scene, run, crashed: true, samples: [] }
  const startCpu = iosCpuSeconds(pid)
  const from = Date.now()
  await sleep(measureSeconds)
  const to = Date.now()
  if (shOrEmpty(`ps -p ${pid} -o pid=`) === '') return { scene, run, crashed: true, samples: [] }
  const cpuPercent = ((iosCpuSeconds(pid) - startCpu) / ((to - from) / 1000)) * 100
  const memoryMb = iosMemory(pid)
  const log = shOrEmpty(
    `xcrun simctl spawn ${SIMULATOR} log show --last ${measureSeconds + 5}s --info --style compact --predicate 'eventMessage CONTAINS "RNFBENCH"'`
  )
  const lines = log.split('\n').filter((line) => line.includes('RNFBENCH'))
  return { scene, run, crashed: false, cpuPercent, memoryMb, samples: parseSamples(lines, from, to) }
}

function deviceName(): string {
  if (platform === 'android') {
    const prop = (name: string) => shOrEmpty(`${ADB} shell getprop ${name}`)
    return `${prop('ro.product.manufacturer')} ${prop('ro.product.model')} (${prop('ro.soc.model')}), Android ${prop('ro.build.version.release')}`
  }
  const simulator = /^\s*(.+?) \(/m.exec(shOrEmpty(`xcrun simctl list devices | grep ${SIMULATOR}`))?.[1] ?? SIMULATOR
  return `${simulator} simulator on ${sh('sysctl -n machdep.cpu.brand_string')}`
}

const results: RunResult[] = []
for (const scene of scenes) {
  for (let run = 1; run <= runs; run++) {
    let result = platform === 'android' ? await runAndroid(scene, run) : await runIos(scene, run)
    if (result.crashed) {
      console.log(`${scene} run ${run} crashed or left the foreground; retrying once`)
      result = platform === 'android' ? await runAndroid(scene, run) : await runIos(scene, run)
    }
    results.push(result)
    console.log(`${version} ${platform} ${scene} #${run}: cpu ${result.cpuPercent?.toFixed(1)}% samples ${result.samples.length}`)
  }
}
const output = join(import.meta.dir, 'results', `${[platform, version, backend].filter(Boolean).join('-')}.json`)
writeFileSync(output, JSON.stringify({ platform, version, backend, device: deviceName(), warmupSeconds, measureSeconds, results }, null, 2))
console.log(`wrote ${output}`)
