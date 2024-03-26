import * as React from 'react'
import { StyleSheet, Pressable, Text, View } from 'react-native'
import { NavigationContainer, useNavigation } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { AnimationTransitions } from './AnimationTransitions'
import { PhysicsCoin } from './PhysicsCoin'
import { FadeOut } from './FadeOut'
import { ChangeMaterials } from './ChangeMaterials'
import { CastShadow } from './CastShadow'
import { MultipleInstances } from './MultipleInstances'

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
      <NavigationItem name="▶️ Animation Transitions" route="AnimationTransitions" />
      <NavigationItem name="💰 Physics Coin" route="PhysicsCoin" />
      <NavigationItem name="😶‍🌫️ Fade Out" route="FadeOut" />
      <NavigationItem name="🎨 Change Materials" route="ChangeMaterials" />
      <NavigationItem name="🌑 Cast Shadow" route="CastShadow" />
      <NavigationItem name="🤖 Multiple Instances" route="MultipleInstances" />
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
          name="AnimationTransitions"
          component={AnimationTransitions}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen name="PhysicsCoin" component={PhysicsCoin} />
        <Stack.Screen name="FadeOut" component={FadeOut} />
        <Stack.Screen name="ChangeMaterials" component={ChangeMaterials} />
        <Stack.Screen name="CastShadow" component={CastShadow} />
        <Stack.Screen name="MultipleInstances" component={MultipleInstances} />
        <Stack.Screen name="Test" component={TestScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}

export default App
