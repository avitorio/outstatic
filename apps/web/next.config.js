const withTM = require('next-transpile-modules')(['outstatic'])

module.exports = withTM({
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: '/docs',
        destination: '/docs/introduction',
        permanent: true
      }
    ]
  }
})
