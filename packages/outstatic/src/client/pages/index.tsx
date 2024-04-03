'use client'
import { OutstaticData } from '@/app'
import Login from './login'
import Welcome from './welcome'
import Layout from '../layout'
import { ReactElement } from 'react'
import AddCustomField from './add-custom-field'
import Collections from './collections'
import EditDocument from './edit-document'
import List from './list'
import NewCollection from './new-collection'
import Settings from './settings'
import Onboarding from './onboarding'
import useOutstatic from '@/utils/hooks/useOutstatic'
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
