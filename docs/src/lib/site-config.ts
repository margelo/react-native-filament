export const siteConfig = {
  name: 'react-native-filament',
  description: 'A real-time physically based 3D rendering engine for React Native, built on Google Filament and Nitro Modules.',
  basePath: process.env.NEXT_PUBLIC_DOCS_BASE_PATH ?? '/react-native-filament',
  url: process.env.NEXT_PUBLIC_DOCS_SITE_URL ?? 'https://margelo.github.io/react-native-filament',
  repositoryUrl: 'https://github.com/margelo/react-native-filament',
  editUrl: 'https://github.com/margelo/react-native-filament/blob/main/docs/content',
}

export function withBasePath(path: string): string {
  return `${siteConfig.basePath}${path}`
}
