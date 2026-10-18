import { RootProvider } from 'fumadocs-ui/provider/next'
import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import type { ReactNode } from 'react'
import { siteConfig, withBasePath } from '@/lib/site-config'
import './global.css'

const sans = Geist({ variable: '--font-sans', subsets: ['latin'] })
const mono = Geist_Mono({ variable: '--font-mono', subsets: ['latin'] })

export const viewport: Viewport = { viewportFit: 'cover' }

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  applicationName: siteConfig.name,
  title: { default: siteConfig.name, template: `%s | ${siteConfig.name}` },
  description: siteConfig.description,
  icons: { icon: withBasePath('/img/favicon.ico') },
}

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`dark ${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <body className="flex min-h-dvh flex-col">
        <RootProvider
          theme={{ defaultTheme: 'dark' }}
          search={{ options: { type: 'static', api: withBasePath('/search.json') } }}
        >
          {children}
        </RootProvider>
      </body>
    </html>
  )
}
