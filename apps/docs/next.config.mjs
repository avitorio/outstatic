import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  transpilePackages: ['outstatic'],
  reactStrictMode: true,
  basePath: '/docs',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'vercel.com',
      },
    ],
    dangerouslyAllowSVG: true,
  },
  redirects: async () => {
    return [
      {
        source: '/',
        destination: '/docs',
        permanent: true,
        basePath: false
      },
    ];
  },
  
};

export default withMDX(config);
