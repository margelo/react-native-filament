import { Worklets } from 'react-native-worklets-core'
import { FilamentProxy } from './native/FilamentProxy'

export const WorkletRuntime = Worklets.createContext('FilamentRenderer')

console.log('1')
const proxy = FilamentProxy
Worklets.createRunInContextFn(() => {
  console.log('in context')
  const test = proxy.createTestObject()
  console.log('test obj')
  console.log('data: ' + test.int)
})()
console.log('ended')
