import type { Example } from '../examples'

const SCHEMES = ['rnfexample://', 'rnfexpo://']

/** The example a `rnfexample://<route>` (CLI app) or `rnfexpo://<route>` (Expo app) link opens, matching the route case-insensitively. */
export function exampleRouteFromUrl(url: string | null, examples: Example[]): string | undefined {
  const scheme = SCHEMES.find((prefix) => url?.startsWith(prefix))
  if (url == null || scheme == null) return undefined
  const path = url.slice(scheme.length).replace(/\/+$/, '').toLowerCase()
  return examples.find((example) => example.route.toLowerCase() === path)?.route
}
