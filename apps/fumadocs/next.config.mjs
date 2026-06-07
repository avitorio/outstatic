import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
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
        source: '/getting-started',
        destination: '/',
        permanent: true,
      }
    ];
  },
  
};

export default withMDX(config);
