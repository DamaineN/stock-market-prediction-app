/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Temporarily ignore TypeScript errors during development
    ignoreBuildErrors: true,
  },
  eslint: {
    // Ignore ESLint errors during build for deployment
    ignoreDuringBuilds: true,
  },
  // Configure for GitHub Pages deployment
  output: 'export',
  trailingSlash: true,
  basePath: process.env.NODE_ENV === 'production' ? '/stock-market-prediction-app' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/stock-market-prediction-app/' : '',
  images: {
    unoptimized: true,
  },
  async rewrites() {
    // In development, proxy to local backend
    // In production, use GitHub backend API
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          source: '/api/v1/:path*',
          destination: 'http://localhost:8000/api/v1/:path*',
        },
      ];
    }
    return [];
  },
}

module.exports = nextConfig
