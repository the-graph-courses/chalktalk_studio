import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'plus.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'assets.aceternity.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'places.googleapis.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Font optimization settings
  experimental: {
    optimizePackageImports: ['@radix-ui/react-icons'],
  },
  // Disable font optimization for Google Fonts to prevent network delays
  optimizeFonts: false,
};

export default nextConfig;
