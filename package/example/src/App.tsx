import * as React from 'react'
import { View, Text, StyleSheet, Pressable } from 'react-native'
import { NavigationContainer, useNavigation } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import Scene from './Scene'

function NavigationItem(props: { name: string; route: string }) {
  const navigation = useNavigation()
  return (
    <Pressable
      onPress={() => {
        navigation.navigate(props.route)
      }}
      style={{
        height: 80,
        width: '100%',
        borderBottomWidth: StyleSheet.hairlineWidth,
        justifyContent: 'center',
        backgroundColor: 'white',
        padding: 20,
      }}>
      <Text
        style={{
          fontSize: 20,
          color: 'black',
        }}>
        {props.name}
      </Text>
    </Pressable>
  )
}

function HomeScreen() {
  return (
    <View style={{ flex: 1 }}>
      <NavigationItem name="Scene" route="Scene" />
    </View>
  )
}

function TestScreen() {
  return (
    <View style={{ flex: 1 }}>
      <Text>Test Screen</Text>
    </View>
  )
}

const Stack = createNativeStackNavigator()

function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Scene">
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen
          name="Scene"
          component={Scene}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen name="Test" component={TestScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}

export default App
