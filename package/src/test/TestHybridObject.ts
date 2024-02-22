import { FilamentProxy } from '../native/FilamentProxy'

export function testHybridObject() {
  console.log('------ BEGIN HybridObject tests...')
  // 1. Creation
  console.log('Creating HybridObject...')
  const hybridObject = FilamentProxy.createTestObject()
  if (hybridObject == null) throw new Error('Failed to create TestHybridObject!')
  console.log('Created HybridObject!')

  // 2. Logging the entire thing as JSON
  console.log(hybridObject)

  // 3. Int Getter & Setter
  console.log(`Int: ${hybridObject.int}`)
  if (typeof hybridObject.int !== 'number') {
    throw new Error('int is not of type number!')
  }
  hybridObject.int = 7642
  if (hybridObject.int !== 7642) {
    throw new Error("setting int didn't work!")
  }
  console.log(`New Int: ${hybridObject.int}`)

  // 4. String Getter & Setter
  console.log(`String: ${hybridObject.string}`)
  if (typeof hybridObject.string !== 'string') {
    throw new Error('string is not of type string!')
  }
  hybridObject.string = 'new string value!'
  if (hybridObject.string !== 'new string value!') {
    throw new Error("setting string didn't work!")
  }
  console.log(`New String: ${hybridObject.string}`)

  // 5. Testing multiple arguments and maps
  const result = hybridObject.multipleArguments(5, true, 'hahah!')
  console.log(`multipleArguments() -> ${JSON.stringify(result)}`)
  try {
    // @ts-expect-error
    hybridObject.multipleArguments(5, true, 'hahah!', 'too-many-arguments!!!')
    throw new Error("multipleArguments(): Too many arguments didn't throw an error!!")
  } catch (e) {
    console.log('multipleArguments(): Too many arguments properly threw an error, as expected.')
  }

  // 6. Testing callbacks
  hybridObject.sayHelloCallback(() => 'hello from JS!')
  const getter = hybridObject.getIntGetter()
  console.log(`Int getter: ${getter()}`)
  if (typeof getter !== 'function' || typeof getter() !== 'number' || getter() !== hybridObject.int) {
    throw new Error('int getter did not work!')
  }

  // 7. Create a new one
  const newObject = hybridObject.createNewHybridObject()
  console.log(`Created new hybrid object!`, newObject)

  console.log('------ END HybridObject tests!')
}
