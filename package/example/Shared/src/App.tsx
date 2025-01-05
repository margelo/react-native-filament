import * as React from 'react'
import { StyleSheet, Pressable, Text, View, ScrollView } from 'react-native'
import { NavigationContainer, useNavigation } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { GestureHandlerRootView } from 'react-native-gesture-handler'

import { AnimationTransitions } from './AnimationTransitions'
import { CameraPan } from './CameraPan'
import { AnimationTransitionsRecording } from './AnimationTransitionsRecording'
import { ImageExample } from './ImageExample'
import { LoadFromFile } from './LoadFromFile'
import { NoneTransparent } from './NoneTransparent'
import { MultipleInstances } from './MultipleInstances'
import { AnimatedRotate } from './AnimatedRotate'
import { AnimatedRotateSharedValues } from './AnimatedRotateSharedValues'
import { PhysicsCoin } from './PhysicsCoin'
import { FadeOut } from './FadeOut'
import { CastShadow } from './CastShadow'
import { ScaleEffect } from './ScaleEffect'
import { ChangeMaterials } from './ChangeMaterials'
import { SkyboxExample } from './SkyboxExample'
import { MorphTargets } from './MorphTargets'

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
      <NavigationItem name="📹 Offscreen recording" route="AnimationTransitionsRecording" />
      <NavigationItem name="🏞️ Image" route="ImageExample" />
      <NavigationItem name="📦 Load from file" route="LoadFromFile" />
      <NavigationItem name="🫥 None Transparent rendering" route="NoneTransparent" />
      <NavigationItem name="🤖 Multiple Instances" route="MultipleInstances" />
      <NavigationItem name="🔄 Animated Rotate" route="AnimatedRotate" />
      <NavigationItem name="🔄 Animated Rotate w/ Shared Values" route="AnimatedRotateSharedValues" />
      <NavigationItem name="💰 Physics Coin" route="PhysicsCoin" />
      <NavigationItem name="😶‍🌫️ Fade Out" route="FadeOut" />
      <NavigationItem name="🌑 Cast Shadow" route="CastShadow" />
      <NavigationItem name="↕️ Scale Effect" route="ScaleEffect" />
      <NavigationItem name="🎨 Change Materials" route="ChangeMaterials" />
      <NavigationItem name="☁️ Skybox" route="SkyboxExample" />
      <NavigationItem name="🔄 MorphTargets" route="MorphTargets" />
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
          <Stack.Screen name="AnimationTransitionsRecording" component={AnimationTransitionsRecording} />
          <Stack.Screen name="ImageExample" component={ImageExample} />
          <Stack.Screen name="LoadFromFile" component={LoadFromFile} />
          <Stack.Screen name="NoneTransparent" component={NoneTransparent} />
          <Stack.Screen name="MultipleInstances" component={MultipleInstances} />
          <Stack.Screen name="AnimatedRotate" component={AnimatedRotate} />
          <Stack.Screen name="AnimatedRotateSharedValues" component={AnimatedRotateSharedValues} />
          <Stack.Screen name="PhysicsCoin" component={PhysicsCoin} />
          <Stack.Screen name="FadeOut" component={FadeOut} />
          <Stack.Screen name="CastShadow" component={CastShadow} />
          <Stack.Screen name="ScaleEffect" component={ScaleEffect} />
          <Stack.Screen name="ChangeMaterials" component={ChangeMaterials} />
          <Stack.Screen name="Test" component={TestScreen} />
          <Stack.Screen name="SkyboxExample" component={SkyboxExample} />
          <Stack.Screen name="MorphTargets" component={MorphTargets} />
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  )
}

export default App
