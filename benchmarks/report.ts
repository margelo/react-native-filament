/**
 * Turns `benchmarks/results/<platform>-<version>[-<backend>].json` into `benchmarks/RESULTS.md`.
 *
 *   bun benchmarks/report.ts
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

interface Sample {
  render: number
  js: number
  ui: number
}

interface RunResult {
  scene: string
  crashed: boolean
  cpuPercent?: number
  threads?: Record<string, number>
  memoryMb?: Record<string, number>
  samples: Sample[]
}

interface ResultFile {
  platform: 'android' | 'ios'
  version: 'v1' | 'v2'
  backend?: string
  device?: string
  warmupSeconds: number
  measureSeconds: number
  results: RunResult[]
}

const SCENES: Record<string, string> = {
  benchstatic: 'Static model, continuous',
  benchstaticondemand: 'Static model, on-demand',
  benchanimated: 'Animated model',
  benchinstances: '100 animated drones',
  benchrotations: '400 coins rotated from JS each frame',
  benchphysics: '200 physics coins',
}

const ON_DEMAND_SCENE = 'benchstaticondemand'
const PLATFORMS = { android: 'Android', ios: 'iOS Simulator' } as const
const MEMORY_KEY = { android: 'totalPss', ios: 'footprint' } as const

interface Column {
  label: string
  file: string
}

/** The 1.x baseline first, then every Nitro configuration compared with it. */
const COLUMNS: Record<keyof typeof PLATFORMS, Column[]> = {
  android: [
    { label: '1.x, OpenGL', file: 'android-v1' },
    { label: 'Nitro, Vulkan', file: 'android-v2-vulkan' },
    { label: 'Nitro, OpenGL', file: 'android-v2-opengl' },
  ],
  ios: [
    { label: '1.x, Metal', file: 'ios-v1' },
    { label: 'Nitro, Metal', file: 'ios-v2-metal' },
  ],
}

function load(file: string): ResultFile | undefined {
  const path = join(import.meta.dir, 'results', `${file}.json`)
  return existsSync(path) ? (JSON.parse(readFileSync(path, 'utf8')) as ResultFile) : undefined
}

const mean = (values: number[]) => (values.length === 0 ? NaN : values.reduce((sum, value) => sum + value, 0) / values.length)

interface SceneStats {
  crashed: boolean
  render: number
  renderMin: number
  js: number
  jsMin: number
  ui: number
  uiMin: number
  cpu: number
  cpuPerFrameMs: number
  memory: number
  threads: Record<string, number>
}

function stats(file: ResultFile, scene: string): SceneStats | undefined {
  const runs = file.results.filter((result) => result.scene === scene)
  if (runs.length === 0) return undefined
  const measured = runs.filter((run) => !run.crashed)
  const samples = measured.flatMap((run) => run.samples)
  const threads: Record<string, number> = {}
  for (const run of measured) {
    for (const [name, percent] of Object.entries(run.threads ?? {})) {
      threads[name] = (threads[name] ?? 0) + percent / measured.length
    }
  }
  const metric = (key: keyof Sample) => samples.map((sample) => sample[key])
  const cpu = mean(measured.map((run) => run.cpuPercent ?? NaN))
  const render = mean(metric('render'))
  return {
    crashed: measured.length === 0,
    render,
    renderMin: Math.min(...metric('render')),
    js: mean(metric('js')),
    jsMin: Math.min(...metric('js')),
    ui: mean(metric('ui')),
    uiMin: Math.min(...metric('ui')),
    cpu,
    cpuPerFrameMs: render >= 1 ? (cpu * 10) / render : NaN,
    memory: mean(measured.map((run) => run.memoryMb?.[MEMORY_KEY[file.platform]] ?? NaN)),
    threads,
  }
}

const fps = (average: number, min: number) => (Number.isNaN(average) ? '–' : `${average.toFixed(1)} (${min.toFixed(0)})`)
const number = (value: number, unit: string) => (Number.isNaN(value) ? '–' : `${value.toFixed(1)}${unit}`)

function delta(v1: number, v2: number, higherIsBetter: boolean): string {
  if (Number.isNaN(v1) || Number.isNaN(v2) || v1 === 0) return '–'
  const percent = ((v2 - v1) / v1) * 100
  if (Math.abs(percent) < 2) return '≈'
  const better = higherIsBetter ? percent > 0 : percent < 0
  return `${percent > 0 ? '+' : ''}${percent.toFixed(0)}% ${better ? '✅' : '🔻'}`
}

interface Metric {
  title: string
  higherIsBetter: boolean
  onDemandNote?: string
  format: (s: SceneStats) => string
  value: (s: SceneStats) => number
}

const METRICS: Metric[] = [
  {
    title: 'Render FPS, frames Filament rendered: average (worst second)',
    higherIsBetter: true,
    onDemandNote: 'renders only on change',
    format: (s) => fps(s.render, s.renderMin),
    value: (s) => s.render,
  },
  {
    title: 'JS FPS, requestAnimationFrame on the React Native runtime: average (worst second)',
    higherIsBetter: true,
    format: (s) => fps(s.js, s.jsMin),
    value: (s) => s.js,
  },
  {
    title: 'UI FPS, Reanimated frame callback: average (worst second)',
    higherIsBetter: true,
    format: (s) => fps(s.ui, s.uiMin),
    value: (s) => s.ui,
  },
  { title: 'CPU, whole app process (100% = one core)', higherIsBetter: false, format: (s) => number(s.cpu, '%'), value: (s) => s.cpu },
  {
    title: 'CPU time per rendered frame',
    higherIsBetter: false,
    onDemandNote: 'no frames rendered',
    format: (s) => number(s.cpuPerFrameMs, ' ms'),
    value: (s) => s.cpuPerFrameMs,
  },
  { title: 'Memory', higherIsBetter: false, format: (s) => number(s.memory, ' MB'), value: (s) => s.memory },
]

function cell(s: SceneStats | undefined, metric: Metric): string {
  if (s == null) return '–'
  return s.crashed ? 'crashed' : metric.format(s)
}

function platformSection(platform: keyof typeof PLATFORMS): string[] {
  const columns = COLUMNS[platform]
    .map((column) => ({ ...column, data: load(column.file) }))
    .filter((column): column is Column & { data: ResultFile } => column.data != null)
  if (columns.length === 0) return []
  const [baseline, ...candidates] = columns
  const reference = columns[columns.length - 1]!.data
  const lines = [`## ${PLATFORMS[platform]}`, '']
  if (reference.device != null) lines.push(`Device: ${reference.device}.`, '')
  const runCounts = columns.flatMap(({ data }) =>
    Object.keys(SCENES).map((scene) => data.results.filter((result) => result.scene === scene).length)
  )
  const [fewestRuns, mostRuns] = [Math.min(...runCounts), Math.max(...runCounts)]
  lines.push(
    `Each scene ran ${fewestRuns === mostRuns ? fewestRuns : `${fewestRuns} to ${mostRuns}`} times from a cold launch, warmed up for ${reference.warmupSeconds} s and was measured for ${reference.measureSeconds} s. Changes compare each Nitro configuration with ${baseline!.label}.`,
    ''
  )
  const header = ['Scene', baseline!.label, ...candidates.flatMap((column) => [column.label, 'Change'])]
  for (const metric of METRICS) {
    const title = metric.title === 'Memory' ? (platform === 'android' ? 'Memory, total PSS' : 'Memory, physical footprint') : metric.title
    lines.push(
      `### ${title}`,
      '',
      `| ${header.join(' | ')} |`,
      `|---|${header
        .slice(1)
        .map(() => '---:')
        .join('|')}|`
    )
    for (const [scene, label] of Object.entries(SCENES)) {
      const base = stats(baseline!.data, scene)
      const cells = [label, cell(base, metric)]
      for (const candidate of candidates) {
        const value = stats(candidate.data, scene)
        const change =
          scene === ON_DEMAND_SCENE && metric.onDemandNote != null
            ? metric.onDemandNote
            : base == null || value == null || base.crashed || value.crashed
              ? '–'
              : delta(metric.value(base), metric.value(value), metric.higherIsBetter)
        cells.push(cell(value, metric), change)
      }
      lines.push(`| ${cells.join(' | ')} |`)
    }
    lines.push('')
  }
  if (platform === 'android') lines.push(...threadSection(columns))
  return lines
}

function topThreads(file: ResultFile, scene: string): string {
  const s = stats(file, scene)
  if (s == null || s.crashed) return '–'
  return Object.entries(s.threads)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4)
    .map(([name, percent]) => `${name} ${percent.toFixed(0)}%`)
    .join(', ')
}

function threadSection(columns: (Column & { data: ResultFile })[]): string[] {
  const header = ['Scene', ...columns.map((column) => column.label)]
  const lines = ['### Busiest threads', '', `| ${header.join(' | ')} |`, `|${header.map(() => '---').join('|')}|`]
  for (const [scene, label] of Object.entries(SCENES)) {
    lines.push(`| ${[label, ...columns.map((column) => topThreads(column.data, scene))].join(' | ')} |`)
  }
  lines.push('')
  return lines
}

const output = [
  '# Benchmark: react-native-filament 1.x vs Nitro',
  '',
  'Generated by `bun benchmarks/report.ts` from the JSON files in `benchmarks/results`. Both versions run the same scenes in Release builds of the example app; see [README.md](./README.md) for the method.',
  '',
  ...platformSection('android'),
  ...platformSection('ios'),
].join('\n')

writeFileSync(join(import.meta.dir, 'RESULTS.md'), output)
console.log(output)
