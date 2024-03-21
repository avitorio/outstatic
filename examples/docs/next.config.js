/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
