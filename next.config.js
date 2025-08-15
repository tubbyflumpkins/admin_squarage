/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [],
  },
  // Vercel-specific optimizations
  swcMinify: true,
  poweredByHeader: false,
  compress: true,
}

module.exports = nextConfig