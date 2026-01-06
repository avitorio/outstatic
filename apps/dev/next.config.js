const { withOutstatic } = require('outstatic/next-plugin')

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['outstatic'],
  images: {
    localPatterns: [
      {
        pathname: '/api/og'
      },
      {
        pathname: '/images/**'
      }
    ]
  }
}

module.exports = withOutstatic(nextConfig)
