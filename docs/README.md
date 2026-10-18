# react-native-filament docs

The documentation website, built with [Fumadocs](https://fumadocs.dev) on Next.js and exported as a static site to GitHub Pages.

## Structure

- `content/docs`: the guides, written in MDX.
- `content/api`: the API reference. Generated, not checked in.
- `config/api-examples`: the Declarative and Imperative usage examples shown on every API page, keyed by `<category>/<ExportName>`.
- `scripts/generate-api.ts`: turns the TypeDoc JSON of `packages/react-native-filament` into `content/api`.
- `src/components/landing`: the home page hero, a Klein bottle rendered live with Filament for WebGL from `public/filament`.

Every guide and API page that documents an API shows both styles in an `<ApiTabs>` block: `<Declarative>` for the React components and hooks, `<Imperative>` for the native Nitro objects.

## Development

Install from the repository root, then start the dev server:

```sh
bun install
bun run --cwd docs dev
```

`dev` and `build` regenerate the API reference first. Run `bun run --cwd docs api` to regenerate it on its own after changing doc comments in the package.

## Build

```sh
bun run --cwd docs build
```

The static site is written to `docs/out` and served under `/react-native-filament`. The `Deploy to GitHub Pages` workflow builds and deploys it on every push to `main` that touches `docs` or the package sources.

## Deploy to Cloudflare

The site also deploys as a Cloudflare Worker with static assets (`wrangler.jsonc`), served from the root path:

```sh
bunx wrangler login
bun run --cwd docs deploy:cloudflare
```

`deploy:cloudflare` builds with `DOCS_BASE_PATH` empty and `DOCS_SITE_URL` set to the Worker's URL, then runs `wrangler deploy`. `public/_headers` sets long-lived caching for hashed Next.js assets on Cloudflare.

## Landing page loading

The home page preloads `filament.wasm` and the hero IBL with the HTML and starts Filament before React hydrates (`src/components/landing/filament-preload.tsx`). The IBL (`public/filament/hero_ibl.ktx`) is the library's `default_env_ibl.ktx` without its 256 px mip level, and is also shipped gzipped (`hero_ibl.ktx.gz`) because not every host compresses `.ktx` files.

Until the first live frame, the hero shows `public/filament/hero-poster.webp`, a transparent capture of that frame placed with CSS by `src/components/landing/hero-poster.json`. Regenerate both with `bun run --cwd docs poster` (needs Chrome and a running docs server) after changing the hero camera, the bottle or its material.

