import { getHostComponent } from 'react-native-nitro-modules'
import type { FilamentViewMethods, FilamentViewProps } from '../specs/targets/FilamentView.nitro'

const FilamentViewConfig = require('../../nitrogen/generated/shared/json/FilamentViewConfig.json')

/**
 * The native view Filament renders into, without a scene or camera. Get the view from
 * `hybridRef={callback(setView)}` and pass it to `engine.createViewTarget()`. Prefer `FilamentView`
 * unless you manage the Engine yourself.
 */
export const NativeFilamentView = getHostComponent<FilamentViewProps, FilamentViewMethods>('FilamentView', () => FilamentViewConfig)
