import type { NextConfig } from 'next'
import path from 'path'

const BACKEND_URL = process.env.BACKEND_INTERNAL_URL ?? 'http://localhost'

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  images: {
    unoptimized: process.env.NODE_ENV !== 'production',
    remotePatterns: [
      { protocol: 'http',  hostname: 'localhost', port: '', pathname: '/uploads/**' },
      { protocol: 'https', hostname: '**.compawgnon.fr', pathname: '/uploads/**' },
      { protocol: 'https', hostname: '*.ngrok-free.app', pathname: '/uploads/**' },
      { protocol: 'https', hostname: '*.trycloudflare.com', pathname: '/uploads/**' },
    ],
  },
  async rewrites() {
    return [
      { source: '/api/:path*',     destination: `${BACKEND_URL}/api/:path*` },
      { source: '/uploads/:path*', destination: `${BACKEND_URL}/uploads/:path*` },
    ]
  },
}

export default nextConfig
