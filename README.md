<a href="https://margelo.io">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="./img/banner-dark.png" />
    <source media="(prefers-color-scheme: light)" srcset="./img/banner-light.png" />
    <img alt="react-native-filament" src="./img/banner-light.png" />
  </picture>
</a>

<br />

### Features

react-native-filament is a powerful 3D rendering engine for React Native. It features:

* ⚡ List features here with emojis

### Installation

1. Install `react-native-filament` from npm:

```sh
npm i react-native-filament
```

2. `react-native-filament` depends on `react-native-worklets-core`:

```sh
npm i react-native-worklets-core
```

3. Update your pods:

```sh
cd ios && pod install
```

..and get started by [loading your model](https://docs.go.here)!

### Example

```tsx
import { FilamentScene, FilamentView, Model, Camera, DefaultLight } from 'react-native-filament'

function App() {
  return (
    <FilamentScene>
      <FilamentView
        style={{ width: 100, height: 100 }}
        model={model}
      >

        {/* Render with the default camera and light: */}
        <Camera />
        <DefaultLight >

        {/* Add a model to the scene (only glb supported yet): */}
        <Model source={require('./duck.glb')}>

      </FilamentView>
    </FilamentScene>
  )
}
```

> See the [example](./package/example/) app

### Contributing

We welcome contributions to react-native-filament! 🎉

After cloning the repo make sure you have the submodules clones as well:

```sh
git submodule update --init --recursive --depth 1
```

Install all node modules (including the examples)

```sh
cd package
yarn
```

And finally build filament and bullet3:

```sh
# Inside ./package
yarn build-bullet3
yarn build-filament:release # or yarn build-filament:debug
```

You can then build one of the example apps in `package/example/AppExamplePaper` or `package/example/AppExampleFabric`.

### Adopting at scale

react-native-filament is provided _as is_.

If you need help with integrating react-native-filament in your app or have additional bugfixing or feature requests, reach out to us at [margelo.io](https://margelo.io).

### Socials

* 🐦 [**Follow us on Twitter**](https://twitter.com/margelo) for updates
* 💬 [**Join the Margelo Community Discord**](https://discord.gg/6CSHz2qAvA) for chatting about react-native-filament

#### Attributions

The example app in this project uses several free assets:
- <a href="https://www.freepik.com/free-ai-image/space-travel-collage-design_94964745.htm#fromView=search&page=1&position=1&uuid=cf66f9c3-2d56-4228-a3cf-de7c07d418fb">Image by freepik</a>
- "Buster Drone" (https://skfb.ly/TBnX) by LaVADraGoN is licensed under Creative Commons Attribution-NonCommercial (http://creativecommons.org/licenses/by-nc/4.0/).
