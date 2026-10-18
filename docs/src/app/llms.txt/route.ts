import { apiSource, docsSource } from '@/lib/source'
import { siteConfig } from '@/lib/site-config'

export const dynamic = 'force-static'

export async function GET() {
  const pages = [...docsSource.getPages(), ...apiSource.getPages()]
  const texts = await Promise.all(pages.map(async (page) => `# ${page.data.title} (${siteConfig.url}${page.url})\n\n${await page.data.getText('processed')}`))
  return new Response(texts.join('\n\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}
