import React, { useEffect, useState } from 'react'
import { Platform, Text, View } from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'

// Every screen that mounts a FilamentScene. Order is the order of the home list.
export const stressRoutes = [
  'AnimationTransitions',
  'CameraPan',
  'AnimationTransitionsRecording',
  'ImageExample',
  'LoadFromFile',
  'NoneTransparent',
  'MultipleInstances',
  'AnimatedRotate',
  'AnimatedRotateSharedValues',
  'ReanimatedRotation',
  'PhysicsCoin',
  'FadeOut',
  'CastShadow',
  'ScaleEffect',
  'ChangeMaterials',
  'SkyboxExample',
  'MorphTargets',
]

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

/**
 * Pushes every example screen and pops it again, `rounds` times.
 * `dwellMs` is how long a screen stays mounted. Use a short dwell to unmount scenes
 * while their assets are still loading. Progress goes to console.log as "[stress] ...".
 */
export function Stress() {
  const navigation = useNavigation<any>()
  const { dwellMs = 1500, rounds = 3 } = (useRoute().params ?? {}) as { dwellMs?: number; rounds?: number }
  const [status, setStatus] = useState('starting')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      await wait(500)
      for (let round = 1; round <= rounds && !cancelled; round++) {
        for (const route of stressRoutes) {
          if (cancelled) return
          const label = `round ${round}/${rounds} ${route}`
          console.log(`[stress:${Platform.OS}] ${label}`)
          setStatus(label)
          navigation.navigate(route)
          await wait(dwellMs)
          navigation.goBack()
          await wait(300)
        }
      }
      if (!cancelled) {
        console.log(`[stress:${Platform.OS}] done rounds=${rounds} dwellMs=${dwellMs}`)
        setStatus('done')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [navigation, dwellMs, rounds])

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 18 }}>{status}</Text>
    </View>
  )
}
