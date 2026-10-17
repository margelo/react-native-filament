import { useMemo } from 'react'
import type { ComposedGesture } from 'react-native-gesture-handler'
import type { CameraManipulator } from '../specs/control/CameraManipulator.nitro'
import type { OrbitGestureOptions } from './OrbitGestureOptions'

/**
 * Pan orbits, pinch zooms and double tap returns home. The callbacks run on the UI runtime and only
 * queue manipulator commands. Needs react-native-gesture-handler.
 */
export function useOrbitGestures(manipulator: CameraManipulator, options: OrbitGestureOptions = {}): ComposedGesture {
  const pinchSpeed = options.pinchSpeed ?? 100
  return useMemo(() => {
    const { Gesture } = require('react-native-gesture-handler') as typeof import('react-native-gesture-handler')
    const pan = Gesture.Pan()
      .maxPointers(1)
      .onBegin(({ x, y }) => {
        'worklet'
        manipulator.grabBegin(x, y, false)
      })
      .onUpdate(({ x, y }) => {
        'worklet'
        manipulator.grabUpdate(x, y)
      })
      .onFinalize(() => {
        'worklet'
        manipulator.grabEnd()
      })
    const pinch = Gesture.Pinch().onChange(({ focalX, focalY, scaleChange }) => {
      'worklet'
      manipulator.scroll(focalX, focalY, (1 - scaleChange) * pinchSpeed)
    })
    const home = Gesture.Tap()
      .numberOfTaps(2)
      .onEnd(() => {
        'worklet'
        manipulator.jumpToHome()
      })
    return Gesture.Simultaneous(pan, pinch, home)
  }, [manipulator, pinchSpeed])
}
