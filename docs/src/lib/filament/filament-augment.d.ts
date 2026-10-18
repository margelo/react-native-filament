import './filament'

declare module './filament' {
  interface gltfio$ResourceLoader {
    delete(): void
  }
}
