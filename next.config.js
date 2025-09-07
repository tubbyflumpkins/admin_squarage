/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['www.google.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Vercel-specific optimizations
  swcMinify: true,
  poweredByHeader: false,
  compress: true,
}

module.exports = nextConfig