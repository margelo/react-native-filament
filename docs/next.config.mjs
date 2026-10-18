import { createMDX } from 'fumadocs-mdx/next'

const withMDX = createMDX()

/** @type {import('next').NextConfig} */
const config = {
  output: 'export',
  basePath: '/react-native-filament',
  trailingSlash: true,
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
}

export default withMDX(config)
