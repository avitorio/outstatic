import { GetServerSideProps, GetServerSidePropsContext } from 'next'
import {
  hasMissingEnvVar,
  missingEnvVars,
  envVars
} from '../utils/envVarsCheck'

type WelcomeProps = {
  variables: boolean[]
}

export default function Welcome({ variables }: WelcomeProps) {
  return (
    <main className="flex flex-col h-screen items-center justify-center bg-slate-900">
      <h1 className="mb-5 text-center text-xl font-semibold">
        Welcome to Outstatic!
      </h1>
      <div className="mb-20 max-w-2xl border bg-white p-8 text-black">
        <p className="mb-5">
          Before you can access your admin area, make sure the following
          environment variables are set up:
        </p>
        <ul className="mb-5">
          {envVars.map(
            (variable, index) =>
              (
                <li key={variable} className="mb-1">
                  {`${variables[index] ? '✅' : '❌'} Variable`}{' '}
                  <span className="font-semibold">{variable}</span>{' '}
                  {`is ${variables[index] ? 'set.' : 'missing!'}`}
                </li>
              )
          )}
        </ul>
        <p>Note that you need to restart Next.js to apply the changes.</p>
      </div>
    </main>
  )
}

export const getServerSideProps: GetServerSideProps = async (
  context: GetServerSidePropsContext
) => {
  if (!hasMissingEnvVar) {
    context.res.writeHead(302, {
      Location: '/outstatic'
    })
    context.res.end()
  }

  const variables = missingEnvVars

  return {
    props: {
      variables
    }
  }
}
