import 'outstatic/outstatic.css'
import { Outstatic } from 'outstatic'
import { OstClient } from 'outstatic/client'

export default async function Page() {
  const providerData = await Outstatic()
  console.log(providerData)
  return <OstClient providerData={providerData} />
}
