/** @type {import('next').NextConfig} */
// Server-side backend URL (NOT exposed to browser)
const BACKEND_URL = process.env.BACKEND_URL || 'https://backend-production-abe09.up.railway.app';

const nextConfig = {
  output: 'standalone',
  swcMinify: false,
  compiler: { styledComponents: false },
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  async rewrites() {
    return [
      { source: '/api/:path*', destination: BACKEND_URL + '/api/:path*' },
    ];
  },
};

module.exports = nextConfig;
