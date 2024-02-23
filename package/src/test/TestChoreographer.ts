import { FilamentProxy } from '../native/FilamentProxy'

function timeout(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), ms)
  })
}

export async function testChoreographer() {
  console.log('Creating Choreographer...')
  const choreographer = FilamentProxy.createChoreographer()
  console.log('Created Choreographer!', choreographer, 'Adding onFrame listener...')

  let calls = 0
  choreographer.addOnFrameListener((_timestamp) => {
    calls++
  })
  choreographer.start()
  await timeout(1000)
  console.log(`onFrame called ${calls} times in 1000ms, so it's running at ${calls} FPS! Stopping...`)
  const finalCalls = calls
  choreographer.stop()
  await timeout(500)
  if (finalCalls > calls) {
    throw new Error(`Choreographer::onFrame has been called ${finalCalls - calls} times after stoppingg!`)
  }
  console.log('Choreographer successfully stopped!')
}
