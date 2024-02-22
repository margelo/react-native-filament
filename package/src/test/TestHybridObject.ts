import { FilamentProxy } from '../native/FilamentProxy'

interface TestHybridObject {
  int: number
  string: string

  multipleArguments(first: number, second: boolean, third: string): Record<string, number>
  getIntGetter(): () => number
  sayHelloCallback(callback: () => string): void
  createNewHybridObject: () => TestHybridObject
}

const hybridObject = FilamentProxy.createTestObject() as TestHybridObject
console.log(hybridObject.int)
