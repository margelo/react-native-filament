import type { Example } from '../examples'

const SCHEME = 'rnfexample://'

/** The example a `rnfexample://<route>` link opens, matching the route name case-insensitively. */
export function exampleRouteFromUrl(url: string | null, examples: Example[]): string | undefined {
  if (url == null || !url.startsWith(SCHEME)) return undefined
  const path = url.slice(SCHEME.length).replace(/\/+$/, '').toLowerCase()
  return examples.find((example) => example.route.toLowerCase() === path)?.route
}
