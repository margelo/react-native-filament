import type { Float3 } from 'react-native-filament'

export const Config = {
  camera: {
    focalLengthInMillimeters: 28,
    near: 1,
    far: 100,
    cameraPosition: [0, 0, 8] as Float3,
    cameraTarget: [0, 0, 0] as Float3,
    cameraUp: [0, 1, 0] as Float3,
  },
}
