import { getHostComponent } from 'react-native-nitro-modules'
import type { FilamentViewMethods, FilamentViewProps } from '../specs/targets/FilamentView.nitro'

const FilamentViewConfig = require('../../nitrogen/generated/shared/json/FilamentViewConfig.json')

export const NativeFilamentView = getHostComponent<FilamentViewProps, FilamentViewMethods>('FilamentView', () => FilamentViewConfig)
