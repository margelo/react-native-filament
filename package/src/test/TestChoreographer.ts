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
  choreographer.addOnFrameListener((timestamp) => {
    console.log(`Choreographer::onFrame(${timestamp})`)
    calls++
  })
  choreographer.start()
  await timeout(500)
  console.log(`onFrame called ${calls} times in 500ms! Stopping...`)
  const finalCalls = calls
  choreographer.stop()
  await timeout(500)
  if (finalCalls > calls) {
    throw new Error(`Choreographer::onFrame has been called ${finalCalls - calls} times after stoppingg!`)
  }
  console.log('Choreographer successfully stopped!')
}
