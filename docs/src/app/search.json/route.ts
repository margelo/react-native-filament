import { createSearchAPI } from 'fumadocs-core/search/server'
import { apiSource, docsSource } from '@/lib/source'

export const dynamic = 'force-static'

export const { staticGET: GET } = createSearchAPI('advanced', {
  indexes: [...docsSource.getPages(), ...apiSource.getPages()].map((page) => ({
    id: page.url,
    title: page.data.title,
    description: page.data.description,
    url: page.url,
    structuredData: page.data.structuredData,
  })),
})
