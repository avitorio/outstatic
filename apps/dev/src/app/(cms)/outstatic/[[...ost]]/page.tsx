import { Outstatic } from 'outstatic'
import { OstClient } from 'outstatic/client'
import 'outstatic/outstatic.css'

export default async function Page({ params }: { params: { ost: string[] } }) {
  const ostData = await Outstatic()
  return <OstClient ostData={ostData} params={params} />
}
