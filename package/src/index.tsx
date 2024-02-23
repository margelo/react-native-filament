import { testChoreographer } from './test/TestChoreographer'
import { testHybridObject } from './test/TestHybridObject'

export * from './FilamentView'

const TEST_HYBRID_OBJECT = true
if (__DEV__ && TEST_HYBRID_OBJECT) {
  testHybridObject()
  testChoreographer().catch(console.error)
}
