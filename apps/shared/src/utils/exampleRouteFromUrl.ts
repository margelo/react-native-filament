import type { Example } from '../examples'

const SCHEMES = ['rnfexample://', 'rnfexpo://']

export interface ExampleLink {
  route: string
  params: Record<string, string>
}

/**
 * The example a `rnfexample://<route>?<params>` (CLI app) or `rnfexpo://<route>?<params>` (Expo app) link opens, matching the
 * route case-insensitively.
 */
export function exampleRouteFromUrl(url: string | null, examples: Example[]): ExampleLink | undefined {
  const scheme = SCHEMES.find((prefix) => url?.startsWith(prefix))
  if (url == null || scheme == null) return undefined
  const [path = '', query = ''] = url.slice(scheme.length).split('?')
  const route = examples.find((example) => example.route.toLowerCase() === path.replace(/\/+$/, '').toLowerCase())?.route
  if (route == null) return undefined
  const params = Object.fromEntries(
    query
      .split('&')
      .filter((pair) => pair.includes('='))
      .map((pair) => pair.split('=').map(decodeURIComponent) as [string, string])
  )
  return { route, params }
}
