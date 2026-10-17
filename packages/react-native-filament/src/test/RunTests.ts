import { testHybridObject } from './TestHybridObject'

async function wrapTest(name: string, func: () => void | Promise<void>): Promise<void> {
  console.log(`-------- BEGIN TEST: ${name}`)
  try {
    await func()
    console.log(`-------- END TEST: ${name}`)
  } catch (e) {
    console.error(`-------- ERROR IN TEST ${name}:`, e)
  }
}

// TODO: Write proper tests for that that actually run on a device/simulator.
//   I want to make sure Hybrid Objects and Choreographers all work fine and test those in the CI.
export function runTests() {
  const TEST_HYBRID_OBJECTS = true
  if (__DEV__ && TEST_HYBRID_OBJECTS) {
    const run = async () => {
      await wrapTest('HybridObject', testHybridObject)
    }
    run()
  }
}
