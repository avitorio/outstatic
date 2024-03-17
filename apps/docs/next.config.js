/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['outstatic'],
  basePath: '/docs',
  async redirects() {
    return [
      {
        source: '/',
        destination: '/introduction',
        permanent: true
      }
    ]
  }
}

module.exports = nextConfig
