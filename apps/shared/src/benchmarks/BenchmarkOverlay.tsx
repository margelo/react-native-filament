import React, { useEffect, useState } from 'react'
import { StyleSheet, Text } from 'react-native'
import { useFrameCallback, useSharedValue } from 'react-native-reanimated'

export interface BenchmarkSample {
  scene: string
  t: number
  render: number
  js: number
  ui: number
}

interface Props {
  scene: string
  /** Frames the renderer has rendered since the scene started. */
  readRenderFrames: () => Promise<number>
}

/**
 * Logs one `RNFBENCH` line per second with the frame rates of the renderer, the JS thread (frames of
 * requestAnimationFrame) and the UI thread (frames of a Reanimated frame callback).
 */
export function BenchmarkOverlay({ scene, readRenderFrames }: Props) {
  const uiFrames = useSharedValue(0)
  const [sample, setSample] = useState<BenchmarkSample>()
  useFrameCallback(() => {
    uiFrames.value += 1
  })

  useEffect(() => {
    let active = true
    let frame = 0
    let jsFrames = 0
    let windowStart = Date.now()
    let renderStart = 0
    let uiStart = 0
    readRenderFrames().then((frames) => {
      renderStart = frames
    })
    const tick = () => {
      if (!active) return
      jsFrames++
      const now = Date.now()
      if (now - windowStart >= 1000) {
        const seconds = (now - windowStart) / 1000
        const js = jsFrames / seconds
        const ui = (uiFrames.value - uiStart) / seconds
        uiStart = uiFrames.value
        jsFrames = 0
        windowStart = now
        readRenderFrames().then((frames) => {
          if (!active) return
          const next: BenchmarkSample = { scene, t: now, render: (frames - renderStart) / seconds, js, ui }
          renderStart = frames
          console.log(`RNFBENCH ${JSON.stringify(next)}`)
          setSample(next)
        })
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => {
      active = false
      cancelAnimationFrame(frame)
    }
  }, [scene, readRenderFrames, uiFrames])

  return (
    <Text style={styles.overlay} pointerEvents="none">
      {sample == null ? 'Measuring…' : `render ${sample.render.toFixed(1)} · JS ${sample.js.toFixed(1)} · UI ${sample.ui.toFixed(1)} fps`}
    </Text>
  )
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    padding: 6,
    color: 'white',
    backgroundColor: 'rgba(0,0,0,0.6)',
    fontVariant: ['tabular-nums'],
  },
})
