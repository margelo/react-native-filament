import { Platform } from 'react-native'
import type { Spec } from './FilamentNativeModule'

const LINKING_ERROR =
  `The package 'react-native-filament' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n'

// TODO: test if this reall works with the old arch
const RCTFilamentModule = require('./specs/NativeFilamentModule').default
export const FilamentModule = (
  RCTFilamentModule
    ? RCTFilamentModule
    : new Proxy(
        {},
        {
          get() {
            throw new Error(LINKING_ERROR)
          },
        }
      )
) as Spec
