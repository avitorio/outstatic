/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['outstatic'],
  basePath: '/docs',
  async redirects() {
    return [
      {
        source: '/',
        destination: '/docs',
        permanent: true,
        basePath: false
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
