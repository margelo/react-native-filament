import React, { useEffect } from 'react'
import { Linking } from 'react-native'
import { CommonActions, NavigationContainer, useNavigationContainerRef } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { HomeScreen } from './HomeScreen'
import { examples } from './examples'
import { exampleRouteFromUrl } from './utils/exampleRouteFromUrl'

const Stack = createNativeStackNavigator()

export default function App() {
  const navigation = useNavigationContainerRef()

  const open = (url: string | null) => {
    const link = exampleRouteFromUrl(url, examples)
    if (link != null) navigation.dispatch(CommonActions.navigate({ name: link.route, params: link.params }))
  }

  useEffect(() => {
    const subscription = Linking.addEventListener('url', ({ url }) => open(url))
    return () => subscription.remove()
  })

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer ref={navigation} onReady={() => Linking.getInitialURL().then(open)}>
        <Stack.Navigator>
          <Stack.Screen name="Home" component={HomeScreen} />
          {examples.map((example) => (
            <Stack.Screen key={example.route} name={example.route} component={example.component} options={{ title: example.title }} />
          ))}
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  )
}
