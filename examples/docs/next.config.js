/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  basePath: '/docs',
  async redirects() {
    return [
      {
        source: '/',
        destination: '/docs',
        basePath: false,
        permanent: false
      },
      {
        source: '/outstatic',
        destination: '/docs/outstatic',
        basePath: false,
        permanent: true
      },
      {
        source: '/',
        destination: '/introduction',
        permanent: true
      },
      {
        source: '/v1.4',
        destination: '/v1.4/introduction',
        permanent: true
      }
    ]
  }
}

module.exports = nextConfig
