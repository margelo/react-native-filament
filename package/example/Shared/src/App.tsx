import * as React from 'react'
import { StyleSheet, Pressable, Text, View, ScrollView } from 'react-native'
import { NavigationContainer, useNavigation } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { GestureHandlerRootView } from 'react-native-gesture-handler'

import { AnimationTransitions } from './AnimationTransitions'
import { CameraPan } from './CameraPan'
// import { PhysicsCoin } from './PhysicsCoin'
// import { FadeOut } from './FadeOut'
// import { CastShadow } from './CastShadow'
// import { MultipleInstances } from './MultipleInstances'
// import { WorkletExample } from './WorkletExample'
// import { ScaleEffect } from './ScaleEffect'
// import { FadingLightExample } from './FadingLightExample'
// import { ChangeGoldenMaterials } from './ChangeGoldenMaterial'
// import { AnimationTransitionsRecording } from './AnimationTransitionsRecording'

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
    <ScrollView style={{ flex: 1 }}>
      <NavigationItem name="▶️ Animation Transitions" route="AnimationTransitions" />
      <NavigationItem name="📸 Camera Pan" route="CameraPan" />
      {/* <NavigationItem name="📹 Offscreen recording" route="AnimationTransitionsRecording" />
      <NavigationItem name="💰 Physics Coin" route="PhysicsCoin" />
      <NavigationItem name="😶‍🌫️ Fade Out" route="FadeOut" />
      <NavigationItem name="🎨 Change Materials" route="ChangeMaterials" />
      <NavigationItem name="🌑 Cast Shadow" route="CastShadow" />
      <NavigationItem name="🤖 Multiple Instances" route="MultipleInstances" />
      <NavigationItem name="↕️ Scale Effect" route="ScaleEffect" />
      <NavigationItem name="🧠 Worklet Example" route="WorkletExample" />
      <NavigationItem name="💡 Fading Light" route="FadingLight" /> */}
    </ScrollView>
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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen
            name="AnimationTransitions"
            component={AnimationTransitions}
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen name="CameraPan" component={CameraPan} />
          {/* TODO: Migrate */}
          {/* <Stack.Screen name="AnimationTransitionsRecording" component={AnimationTransitionsRecording} />
          <Stack.Screen name="PhysicsCoin" component={PhysicsCoin} />
          <Stack.Screen name="FadeOut" component={FadeOut} />
          <Stack.Screen name="ChangeMaterials" component={ChangeGoldenMaterials} />
          <Stack.Screen name="CastShadow" component={CastShadow} />
          <Stack.Screen name="MultipleInstances" component={MultipleInstances} />
          <Stack.Screen name="WorkletExample" component={WorkletExample} />
          <Stack.Screen name="ScaleEffect" component={ScaleEffect} />
          <Stack.Screen name="FadingLight" component={FadingLightExample} /> */}
          <Stack.Screen name="Test" component={TestScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  )
}

export default App
