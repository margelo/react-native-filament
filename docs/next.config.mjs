import { createMDX } from 'fumadocs-mdx/next'

const withMDX = createMDX()

const basePath = process.env.DOCS_BASE_PATH ?? '/react-native-filament'
const siteUrl = process.env.DOCS_SITE_URL ?? `https://margelo.github.io${basePath}`

/** @type {import('next').NextConfig} */
const config = {
  output: 'export',
  basePath,
  trailingSlash: true,
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_DOCS_BASE_PATH: basePath,
    NEXT_PUBLIC_DOCS_SITE_URL: siteUrl,
  },
}

export default withMDX(config)
