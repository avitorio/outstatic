'use client'
import { OutstaticData } from '@/app'
import Login from './login'
import Welcome from './welcome'
import Layout from '../layout'
import { Router } from '../router'

export type ProviderDataProps = {
  params: { ost: string[] }
  ostData: OutstaticData
}

export const OstClient = ({ ostData, params }: ProviderDataProps) => {
  if (ostData.missingEnvVars) {
    return <Welcome variables={ostData.missingEnvVars} />
  }

  const { session } = ostData
  if (!session) {
    return <Login />
  }
  return (
    <Layout ostData={ostData}>
      <Router params={params} />
    </Layout>
  )
}
