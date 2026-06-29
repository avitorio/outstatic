import { createMDX } from 'fumadocs-mdx/next'

const withMDX = createMDX()

const LEGACY_DOCS_REDIRECTS = [
  ['api-keys', 'access-integration/api-keys'],
  ['block-library', 'editing-modeling/block-library'],
  ['commit-messages', 'access-integration/commit-messages'],
  ['credits', 'help/credits'],
  ['custom-fields', 'editing-modeling/custom-fields'],
  ['environment-variables', 'access-integration/environment-variables'],
  ['faqs', 'help/faqs'],
  ['fetching-data', 'access-integration/fetching-data'],
  [
    'github-apps-authentication',
    'access-integration/github-apps-authentication'
  ],
  ['introduction', 'what-is-outstatic'],
  ['license', 'help/license'],
  ['mdx-block', 'editing-modeling/mdx-block'],
  ['roles', 'access-integration/roles'],
  [
    'setting-up-github-authentication',
    'access-integration/setting-up-github-authentication'
  ],
  ['the-content-editor', 'editing-modeling/the-content-editor'],
  ['troubleshooting', 'help/troubleshooting'],
  ['type-generation', 'access-integration/type-generation'],
  ['upgrading-to-v2.0', 'help/upgrading-to-v2.0']
]

/** @type {import('next').NextConfig} */
const config = {
  transpilePackages: ['outstatic'],
  reactStrictMode: true,
  basePath: '/docs',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'vercel.com'
      }
    ],
    dangerouslyAllowSVG: true
  },
  redirects: async () => {
    return [
      {
        source: '/',
        destination: '/docs',
        permanent: true,
        basePath: false
      },
      ...getLegacyDocsRedirects()
    ]
  }
}

export default withMDX(config)

function getLegacyDocsRedirects() {
  return LEGACY_DOCS_REDIRECTS.flatMap(([source, destination]) => [
    {
      source: `/${source}`,
      destination: `/${destination}`,
      permanent: true
    },
    {
      source: `/${source}/`,
      destination: `/${destination}`,
      permanent: true
    }
  ])
}
