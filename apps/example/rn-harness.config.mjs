import { androidPlatform, physicalAndroidDevice } from '@react-native-harness/platform-android'
import { applePlatform, appleSimulator } from '@react-native-harness/platform-apple'

export default {
  entryPoint: './index.js',
  appRegistryComponentName: 'AppExampleFabric',
  runners: [
    androidPlatform({
      name: 'android',
      device: physicalAndroidDevice(process.env.RNF_ANDROID_MANUFACTURER ?? 'samsung', process.env.RNF_ANDROID_MODEL ?? 'SM-E146B'),
      bundleId: 'com.appexamplefabric',
    }),
    applePlatform({
      name: 'ios',
      device: appleSimulator(process.env.RNF_IOS_SIMULATOR ?? 'iPhone 17', process.env.RNF_IOS_VERSION ?? '27.0'),
      bundleId: 'org.reactjs.native.example.AppExampleFabric',
    }),
  ],
  testTimeout: 30000,
}
