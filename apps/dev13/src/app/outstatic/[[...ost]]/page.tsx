import 'outstatic/outstatic.css'
import { Outstatic } from 'outstatic'
import { OstClient } from 'outstatic/client'

export default async function Page({ params }: { params: { slug: string[] } }) {
  const providerData = await Outstatic()
  console.log({ params })
  return <OstClient providerData={providerData} params={{ slug: [] }} />
}
