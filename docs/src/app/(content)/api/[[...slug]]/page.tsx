import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ContentPage } from '@/components/content-page'
import { apiSource } from '@/lib/source'

interface Props {
  params: Promise<{ slug?: string[] }>
}

export default async function Page({ params }: Props) {
  const { slug } = await params
  return <ContentPage source={apiSource} slug={slug} folder="api" />
}

export function generateStaticParams() {
  return apiSource.generateParams()
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const page = apiSource.getPage(slug)
  if (page == null) notFound()
  return { title: page.data.title, description: page.data.description }
}
