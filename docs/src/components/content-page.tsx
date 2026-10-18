import { DocsBody, DocsDescription, DocsPage, DocsTitle, EditOnGitHub } from 'fumadocs-ui/layouts/docs/page'
import { createRelativeLink } from 'fumadocs-ui/mdx'
import { notFound } from 'next/navigation'
import { CopyMarkdown } from '@/components/copy-markdown'
import { LetsTalk } from '@/components/lets-talk'
import { siteConfig } from '@/lib/site-config'
import type { apiSource, docsSource } from '@/lib/source'
import { getMDXComponents } from '@/mdx-components'

type Source = typeof docsSource | typeof apiSource

export async function ContentPage({ source, slug, folder }: { source: Source; slug: string[] | undefined; folder: 'docs' | 'api' }) {
  const page = source.getPage(slug)
  if (page == null) notFound()
  const MDX = page.data.body
  const markdown = await page.data.getText('processed')
  return (
    <DocsPage
      toc={page.data.toc}
      full={page.data.full}
      tableOfContent={{ footer: <LetsTalk /> }}
    >
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription className="mb-2">{page.data.description}</DocsDescription>
      <div className="flex flex-row items-center gap-2 border-b pb-6">
        <CopyMarkdown markdown={`# ${page.data.title}\n\n${markdown}`} />
        <a
          href={`${siteConfig.repositoryUrl}/issues/new`}
          target="_blank"
          rel="noreferrer"
          className="rounded-lg border px-2.5 py-1.5 text-xs font-medium text-fd-muted-foreground transition-colors hover:bg-fd-accent"
        >
          Report an issue
        </a>
      </div>
      <DocsBody>
        <MDX components={getMDXComponents({ a: createRelativeLink(source, page) })} />
      </DocsBody>
      {folder === 'docs' && <EditOnGitHub href={`${siteConfig.repositoryUrl}/blob/main/docs/content/docs/${page.path}`} />}
    </DocsPage>
  )
}
