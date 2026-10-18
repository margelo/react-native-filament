import type { HomeLayoutProps } from 'fumadocs-ui/layouts/home'
import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared'
import { siteConfig } from '@/lib/site-config'

function MargeloIcon() {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 30 30" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M0 0V30H30L0 0Z" />
      <path d="M30 0V30L19.007 10.9941L30 0Z" />
    </svg>
  )
}

export function Wordmark({ className = '' }: { className?: string }) {
  return <span className={`rnf-wordmark ${className}`}>FILAMENT</span>
}

export function sidebarOptions(): BaseLayoutProps {
  return {
    themeSwitch: { enabled: false },
    nav: { title: <Wordmark className="text-lg md:hidden" /> },
  }
}

export function homeOptions(): HomeLayoutProps {
  return {
    links: [
      { text: 'Docs', url: '/docs', active: 'nested-url' },
      { text: 'API Reference', url: '/api', active: 'nested-url' },
      {
        type: 'icon',
        text: 'Margelo',
        label: 'Margelo',
        url: 'https://margelo.com',
        icon: <MargeloIcon />,
        external: true,
      },
    ],
    githubUrl: siteConfig.repositoryUrl,
    nav: { title: <Wordmark className="text-lg" /> },
  }
}
