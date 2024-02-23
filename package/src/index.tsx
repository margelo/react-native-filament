import { testHybridObject } from './test/TestHybridObject'

export * from './FilamentView'
export * from './native/FilamentProxy'
export * from './native/FilamentTypes'

const TEST_HYBRID_OBJECT = true
if (__DEV__ && TEST_HYBRID_OBJECT) {
  testHybridObject()
}
