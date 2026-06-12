/** @type {import('next').NextConfig} */
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

const nextConfig = {
  output: 'standalone',
  swcMinify: false,
  compiler: { styledComponents: false },
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  async rewrites() {
    return [
      { source: '/api/:path*', destination: API_URL + '/api/:path*' },
    ];
  },
};

module.exports = nextConfig;