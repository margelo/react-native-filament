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

Install react-native-filament from npm:

```sh
npm i react-native-filament
cd ios && pod install
```

..and get started by [loading your model](https://docs.go.here)!

### Example

```tsx
function App() {
  const model = useModel('duck.gltf')

  return (
    <Filament
      style={{ width: 100, height: 100 }}
      model={model}
    />
  )
}
```

> See the [example](./package/example/) app

### Adopting at scale

react-native-filament is provided _as is_.

If you need help with integrating react-native-filament in your app or have additional bugfixing or feature requests, reach out to us at [margelo.io](https://margelo.io).

### Socials

* 🐦 [**Follow us on Twitter**](https://twitter.com/margelo) for updates
* 💬 [**Join the Margelo Community Discord**](https://discord.gg/6CSHz2qAvA) for chatting about react-native-filament
