/** @type {import('next').NextConfig} */
const nextConfig = {
  cacheComponents: true,
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'motion'],
  },
};

export default nextConfig;
